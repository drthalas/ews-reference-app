import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import TimelineIcon from '@mui/icons-material/Timeline';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { DevPanel } from '../../devPanel/ui/DevPanel';
import {
  workItemsApi,
  useGetCommandQuery,
  useGetWorkItemQuery,
  useGetWorkItemsQuery,
  useSubmitWorkItemCommandMutation,
  useUpdateWorkItemOptimisticMutation,
  useUpdateWorkItemMutation,
} from '../api/workItemsApi';
import {
  workItemPriorityLabels,
  workItemPriorityValues,
  workItemStatusLabels,
  workItemStatusValues,
  type ApiError,
  type CommandOperation,
  type UpdateWorkItemRequest,
  type WorkItem,
  type WorkItemPriority,
  type WorkItemStatus,
} from '../model/workItem';
import {
  clearWorkItemEvents,
  type StaleResponseEvent,
  type WorkItemUiEvent,
  workItemEventRecorded,
} from '../model/workItemEventsSlice';

type WorkItemDraft = {
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee: string;
  tags: string;
};

type ConflictState = {
  code: string;
  message: string;
  workItemId: string | null;
  clientRevision: number | null;
  serverRevision: number | null;
  serverWorkItem: WorkItem | null;
};

const POLLING_INTERVAL_MS = 3000;

const statusColor: Record<WorkItemStatus, 'default' | 'info' | 'success' | 'warning'> = {
  new: 'default',
  in_progress: 'info',
  blocked: 'warning',
  done: 'success',
};

const priorityColor: Record<WorkItemPriority, 'default' | 'error' | 'info' | 'warning'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toDraft(workItem: WorkItem): WorkItemDraft {
  return {
    title: workItem.title,
    status: workItem.status,
    priority: workItem.priority,
    assignee: workItem.assignee ?? '',
    tags: workItem.tags.join(', '),
  };
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  const data = getApiError(error);
  if (data?.message || data?.code) {
    return [data.code, data.message].filter(Boolean).join(': ');
  }

  return fallback;
}

function getApiError(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    return (error as { data?: ApiError }).data ?? null;
  }
  return null;
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function isWorkItem(value: unknown): value is WorkItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as WorkItem).id === 'string' &&
    typeof (value as WorkItem).revision === 'number' &&
    typeof (value as WorkItem).updatedAt === 'string'
  );
}

function getConflictState(error: unknown): ConflictState | null {
  const apiError = getApiError(error);
  if (!apiError || (apiError.status !== 409 && !apiError.code.includes('CONFLICT'))) {
    return null;
  }

  const details = apiError.details ?? {};
  return {
    code: apiError.code,
    message: apiError.message,
    workItemId: asString(details.workItemId),
    clientRevision: asNumber(details.clientRevision),
    serverRevision: asNumber(details.serverRevision),
    serverWorkItem: isWorkItem(details.serverWorkItem) ? details.serverWorkItem : null,
  };
}

function toUpdateRequest(draft: WorkItemDraft): UpdateWorkItemRequest {
  return {
    title: draft.title.trim(),
    status: draft.status,
    priority: draft.priority,
    assignee: draft.assignee.trim() || null,
    tags: parseTags(draft.tags),
  };
}

function getCommandStatus(
  workItem: WorkItem,
  commandOperation: CommandOperation | undefined,
  activeOperationId: string | null
) {
  if (commandOperation) {
    return `${commandOperation.operationId}: ${commandOperation.status}`;
  }
  if (workItem.pendingOperation) {
    return `${workItem.pendingOperation}: pending`;
  }
  if (activeOperationId) {
    return `${activeOperationId}: pending`;
  }
  return null;
}

export function WorkItemsReadOnly() {
  const dispatch = useDispatch();
  const prefetchWorkItem = workItemsApi.usePrefetch('getWorkItem');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [optimisticPendingId, setOptimisticPendingId] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const staleEvent = useSelector((state: RootState) => state.workItemEvents.lastStaleResponse);
  const recentEvents = useSelector((state: RootState) => state.workItemEvents.recentEvents);
  const pollingInterval = isPollingEnabled && !optimisticPendingId ? POLLING_INTERVAL_MS : 0;
  const {
    data: workItems,
    error: listError,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch,
  } = useGetWorkItemsQuery(undefined, { pollingInterval });

  useEffect(() => {
    if (!selectedId && workItems?.length) {
      setSelectedId(workItems[0].id);
    }
  }, [selectedId, workItems]);

  useEffect(() => {
    if (workItems) {
      setLastRefreshAt(new Date());
    }
  }, [workItems]);

  const selectedFromList = useMemo(
    () => workItems?.find((workItem) => workItem.id === selectedId) ?? null,
    [selectedId, workItems]
  );

  const {
    data: selectedDetails,
    error: detailsError,
    isLoading: isDetailsLoading,
    isFetching: isDetailsFetching,
    refetch: refetchSelectedDetails,
  } = useGetWorkItemQuery(selectedId ?? skipToken, { pollingInterval });

  const selectedWorkItem = selectedFromList ?? selectedDetails ?? null;
  const prefetchDetails = (id: string) => {
    prefetchWorkItem(id, { ifOlderThan: 20 });
  };
  const reloadSelectedWorkItem = () => {
    refetch();
    if (selectedId) {
      refetchSelectedDetails();
    }
  };

  if (isListLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography>Загружаем WorkItems</Typography>
          </Stack>
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
        </Stack>
      </Paper>
    );
  }

  if (listError) {
    return (
      <Alert
        severity="error"
        icon={<ErrorOutlineIcon />}
        action={
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        WorkItems недоступны. Проверьте backend и повторите запрос.
      </Alert>
    );
  }

  if (!workItems?.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1} alignItems="flex-start">
          <AssignmentTurnedInIcon color="disabled" />
          <Typography variant="h6">WorkItems не найдены</Typography>
          <Typography color="text.secondary">
            Backend вернул пустой список. Seed data можно восстановить через DEV panel reset.
          </Typography>
          <DevPanel selectedWorkItemId={selectedId} onRefreshWorkItems={refetch} />
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info" icon={<InfoOutlinedIcon />}>
        Этап 11: prefetch прогревает details на hover/focus, а UI показывает состояние
        polling, revision, операций и edge cases компактно.
      </Alert>

      {staleEvent ? <StaleResponseAlert event={staleEvent} /> : null}
      <StateLog events={recentEvents} onClear={() => dispatch(clearWorkItemEvents())} />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControlLabel
              control={
                <Switch
                  checked={isPollingEnabled}
                  onChange={(event) => setIsPollingEnabled(event.target.checked)}
                />
              }
              label={isPollingEnabled ? 'Polling: включён' : 'Polling: выключен'}
            />
            <Chip
              icon={<SyncIcon />}
              size="small"
              label={
                optimisticPendingId
                  ? 'Пауза на optimistic update'
                  : isListFetching
                    ? 'Polling refresh'
                    : `${POLLING_INTERVAL_MS / 1000}s interval`
              }
              color={isPollingEnabled ? 'primary' : 'default'}
              variant="outlined"
            />
            <Chip size="small" label="Prefetch: hover/focus" variant="outlined" />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Last refresh: {lastRefreshAt ? formatDate(lastRefreshAt) : 'ещё не было'}
            </Typography>
            <Button size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}>
              Обновить
            </Button>
            <DevPanel selectedWorkItemId={selectedId} onRefreshWorkItems={refetch} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2.5} alignItems="stretch">
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
            <Stack spacing={0}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Typography variant="h6">WorkItems</Typography>
                  <Chip
                    size="small"
                    label={isListFetching ? 'Refreshing' : `${workItems.length} items`}
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <Divider />
              <List disablePadding sx={{ maxHeight: { md: 640 }, overflow: 'auto' }}>
                {workItems.map((workItem) => (
                  <WorkItemListRow
                    key={workItem.id}
                    workItem={workItem}
                    selected={workItem.id === selectedId}
                    onSelect={() => setSelectedId(workItem.id)}
                    onPrefetch={() => prefetchDetails(workItem.id)}
                  />
                ))}
              </List>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <WorkItemDetails
            workItem={selectedWorkItem}
            isLoading={isDetailsLoading}
            isFetching={isDetailsFetching}
            hasError={Boolean(detailsError)}
            onOptimisticPendingChange={setOptimisticPendingId}
            onReloadFromBackend={reloadSelectedWorkItem}
            staleEvent={staleEvent}
            onRecordEvent={(event) => dispatch(workItemEventRecorded(event))}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

function WorkItemListRow({
  workItem,
  selected,
  onSelect,
  onPrefetch,
}: {
  workItem: WorkItem;
  selected: boolean;
  onSelect: () => void;
  onPrefetch: () => void;
}) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onSelect}
      onFocus={onPrefetch}
      onMouseEnter={onPrefetch}
      sx={{
        alignItems: 'flex-start',
        borderLeft: 3,
        borderLeftColor: selected ? 'primary.main' : 'transparent',
        py: 1.5,
      }}
    >
      <ListItemText
        primary={
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {workItem.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {workItem.id}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                color={statusColor[workItem.status]}
                label={workItemStatusLabels[workItem.status]}
              />
              <Chip
                size="small"
                color={priorityColor[workItem.priority]}
                label={workItemPriorityLabels[workItem.priority]}
                variant="outlined"
              />
              <Chip size="small" label={`rev ${workItem.revision}`} variant="outlined" />
              {workItem.pendingOperation ? (
                <Chip
                  size="small"
                  color="secondary"
                  label={`operation ${workItem.pendingOperation}`}
                />
              ) : null}
            </Stack>
          </Stack>
        }
        secondary={
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {workItem.assignee ? `Исполнитель: ${workItem.assignee}` : 'Без исполнителя'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated: {formatDate(workItem.updatedAt)}
            </Typography>
          </Stack>
        }
      />
    </ListItemButton>
  );
}

function StaleResponseAlert({ event }: { event: StaleResponseEvent }) {
  return (
    <Alert severity="warning">
      Stale response ignored: {event.workItemId} from {event.source} returned rev{' '}
      {event.incomingRevision}, current cache kept rev {event.currentRevision}.
    </Alert>
  );
}

function getEventText(event: WorkItemUiEvent) {
  if (event.type === 'stale') {
    return `${event.workItemId}: stale ${event.source} rev ${event.incomingRevision} ignored, kept rev ${event.currentRevision}`;
  }
  return event.workItemId ? `${event.workItemId}: ${event.message}` : event.message;
}

function StateLog({ events, onClear }: { events: WorkItemUiEvent[]; onClear: () => void }) {
  if (!events.length) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <TimelineIcon color="action" fontSize="small" />
            <Typography variant="subtitle2">State log</Typography>
          </Stack>
          <Tooltip title="Очистить локальный журнал">
            <IconButton size="small" onClick={onClear}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {events.map((event) => (
            <Chip
              key={`${event.type}-${event.type === 'stale' ? event.ignoredAt : event.createdAt}-${getEventText(event)}`}
              size="small"
              color={
                event.type === 'error'
                  ? 'error'
                  : event.type === 'warning' || event.type === 'stale'
                    ? 'warning'
                    : event.type === 'success'
                      ? 'success'
                      : 'default'
              }
              variant="outlined"
              label={getEventText(event)}
              sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function ConflictAlert({
  conflict,
  onReloadFromBackend,
  onCancelEditing,
}: {
  conflict: ConflictState;
  onReloadFromBackend: () => void;
  onCancelEditing: () => void;
}) {
  return (
    <Alert severity="warning">
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Конфликт версий
          </Typography>
          <Typography variant="body2">
            Данные на backend изменились. Текущая форма основана на устаревшей версии.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {conflict.code}: {conflict.message}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`client rev ${conflict.clientRevision ?? 'n/a'}`} />
            <Chip size="small" label={`server rev ${conflict.serverRevision ?? 'n/a'}`} />
            {conflict.workItemId ? <Chip size="small" label={conflict.workItemId} /> : null}
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" size="small" onClick={onReloadFromBackend}>
            Обновить с backend
          </Button>
          <Button variant="outlined" size="small" onClick={onCancelEditing}>
            Отменить редактирование
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}

function WorkItemDetails({
  workItem,
  isLoading,
  isFetching,
  hasError,
  onOptimisticPendingChange,
  onReloadFromBackend,
  staleEvent,
  onRecordEvent,
}: {
  workItem: WorkItem | null;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
  onOptimisticPendingChange: (id: string | null) => void;
  onReloadFromBackend: () => void;
  staleEvent: StaleResponseEvent | null;
  onRecordEvent: (event: Omit<Exclude<WorkItemUiEvent, StaleResponseEvent>, 'createdAt'>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<WorkItemDraft | null>(null);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [lastCommandNoticeId, setLastCommandNoticeId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateWorkItem, { isLoading: isSaving }] = useUpdateWorkItemMutation();
  const [updateWorkItemOptimistic, { isLoading: isOptimisticSaving }] =
    useUpdateWorkItemOptimisticMutation();
  const [submitWorkItemCommand, { isLoading: isSubmittingCommand }] =
    useSubmitWorkItemCommandMutation();
  const {
    data: commandOperation,
    error: commandError,
    isFetching: isCommandFetching,
  } = useGetCommandQuery(activeOperationId ?? skipToken, {
    pollingInterval: activeOperationId ? 1000 : 0,
  });

  useEffect(() => {
    if (workItem && !isEditing) {
      setDraft(toDraft(workItem));
    }
  }, [isEditing, workItem]);

  useEffect(() => {
    setConflictState(null);
    setFormError(null);
  }, [workItem?.id]);

  useEffect(() => {
    if (workItem?.pendingOperation && workItem.pendingOperation !== activeOperationId) {
      setActiveOperationId(workItem.pendingOperation);
    }
  }, [activeOperationId, workItem?.pendingOperation]);

  useEffect(() => {
    if (!commandOperation) {
      return;
    }

    if (commandOperation.operationId === lastCommandNoticeId) {
      return;
    }

    if (commandOperation.status === 'completed') {
      setSuccessMessage(`Async command ${commandOperation.operationId} завершена.`);
      setLastCommandNoticeId(commandOperation.operationId);
      onRecordEvent({
        type: 'success',
        workItemId: commandOperation.workItemId,
        message: `command ${commandOperation.operationId} completed`,
      });
      setActiveOperationId(null);
    }

    if (commandOperation.status === 'failed') {
      setFormError(commandOperation.error ?? `Async command ${commandOperation.operationId} failed.`);
      setLastCommandNoticeId(commandOperation.operationId);
      onRecordEvent({
        type: 'error',
        workItemId: commandOperation.workItemId,
        message: `command ${commandOperation.operationId} failed`,
      });
      setActiveOperationId(null);
    }
  }, [commandOperation, lastCommandNoticeId, onRecordEvent]);

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={22} />
          <Typography>Загружаем details выбранного WorkItem</Typography>
        </Stack>
      </Paper>
    );
  }

  if (hasError) {
    return (
      <Alert severity="error" icon={<ErrorOutlineIcon />}>
        Details выбранного WorkItem не загрузились. Список остаётся доступен.
      </Alert>
    );
  }

  if (!workItem) {
    return (
      <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
        <Typography color="text.secondary">Выберите WorkItem, чтобы увидеть details.</Typography>
      </Paper>
    );
  }

  const activeDraft = draft ?? toDraft(workItem);
  const titleError = !activeDraft.title.trim();

  const startEditing = () => {
    setDraft(toDraft(workItem));
    setFormError(null);
    setConflictState(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(toDraft(workItem));
    setFormError(null);
    setConflictState(null);
    setIsEditing(false);
  };

  const updateDraft = <Key extends keyof WorkItemDraft>(key: Key, value: WorkItemDraft[Key]) => {
    setDraft((current) => ({ ...(current ?? toDraft(workItem)), [key]: value }));
    setFormError(null);
    setConflictState(null);
  };

  const reloadAfterConflict = () => {
    onReloadFromBackend();
    setDraft(conflictState?.serverWorkItem ? toDraft(conflictState.serverWorkItem) : toDraft(workItem));
    setFormError(null);
    setConflictState(null);
    setIsEditing(false);
    setSuccessMessage('Данные обновляются с backend.');
    onRecordEvent({
      type: 'info',
      workItemId: workItem.id,
      message: 'conflict resolved by backend reload',
    });
  };

  const saveDraft = async (mode: 'classic' | 'optimistic') => {
    const trimmedTitle = activeDraft.title.trim();
    if (!trimmedTitle) {
      setFormError('Title не должен быть пустым.');
      return;
    }

    const changes = toUpdateRequest({ ...activeDraft, title: trimmedTitle });

    try {
      if (mode === 'optimistic') {
        onOptimisticPendingChange(workItem.id);
      }
      const saved =
        mode === 'optimistic'
          ? await updateWorkItemOptimistic({ id: workItem.id, changes }).unwrap()
          : await updateWorkItem({ id: workItem.id, changes }).unwrap();
      setDraft(toDraft(saved));
      setFormError(null);
      setSuccessMessage(
        mode === 'optimistic'
          ? 'Optimistic update подтверждён backend'
          : 'Изменения сохранены'
      );
      onRecordEvent({
        type: 'success',
        workItemId: saved.id,
        message: mode === 'optimistic' ? 'optimistic save confirmed' : 'server-confirmed save',
      });
      setIsEditing(false);
    } catch (error) {
      if (mode === 'optimistic') {
        setDraft(toDraft(workItem));
      }
      const conflict = getConflictState(error);
      if (conflict) {
        setConflictState(conflict);
        onRecordEvent({
          type: 'warning',
          workItemId: conflict.workItemId ?? workItem.id,
          message: `conflict ${conflict.code}`,
        });
        setFormError(null);
        setSuccessMessage(null);
        return;
      }
      setFormError(
        getMutationErrorMessage(
          error,
          mode === 'optimistic'
            ? 'Backend вернул ошибку, изменения откатились.'
            : 'Не удалось сохранить изменения. Проверьте данные и повторите попытку.'
        )
      );
    } finally {
      if (mode === 'optimistic') {
        onOptimisticPendingChange(null);
      }
    }
  };

  const runAsyncCompleteCommand = async () => {
    setFormError(null);
    setSuccessMessage(null);

    try {
      const submitted = await submitWorkItemCommand({
        id: workItem.id,
        command: { type: 'complete' },
      }).unwrap();
      setActiveOperationId(submitted.operationId);
      setLastCommandNoticeId(null);
      setSuccessMessage(`Async command ${submitted.operationId} принята backend.`);
      onRecordEvent({
        type: 'info',
        workItemId: workItem.id,
        message: `command ${submitted.operationId} accepted`,
      });
    } catch (error) {
      setFormError(
        getMutationErrorMessage(
          error,
          'Не удалось запустить async command. Проверьте backend и повторите попытку.'
        )
      );
    }
  };

  const commandStatus = getCommandStatus(workItem, commandOperation, activeOperationId);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Stack spacing={2}>
        {isSaving || isOptimisticSaving ? <LinearProgress /> : null}
        {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        {commandError ? (
          <Alert severity="error">
            Command status не загрузился. Polling продолжит обновлять WorkItem.
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {workItem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {workItem.id}
              {isFetching ? ' / details refresh' : ''}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {conflictState ? <Chip color="warning" label="Conflict detected" /> : null}
            {isOptimisticSaving ? (
              <Chip color="secondary" label="Ожидает подтверждения backend" />
            ) : null}
            {commandStatus ? (
              <Chip
                color="secondary"
                label={isCommandFetching ? `${commandStatus} / checking` : commandStatus}
              />
            ) : null}
            <Chip
              color={statusColor[workItem.status]}
              label={workItemStatusLabels[workItem.status]}
            />
            <Chip
              color={priorityColor[workItem.priority]}
              label={workItemPriorityLabels[workItem.priority]}
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Divider />

        {isEditing ? (
          <WorkItemEditForm
            draft={activeDraft}
            disabled={isSaving || isOptimisticSaving || Boolean(conflictState)}
            titleError={titleError}
            onChange={updateDraft}
          />
        ) : (
          <WorkItemReadDetails workItem={workItem} commandOperation={commandOperation} />
        )}

        {conflictState ? (
          <ConflictAlert
            conflict={conflictState}
            onReloadFromBackend={reloadAfterConflict}
            onCancelEditing={cancelEditing}
          />
        ) : null}

        {staleEvent?.workItemId === workItem.id ? (
          <Alert severity="warning">
            Stale response ignored for {staleEvent.workItemId}: incoming rev{' '}
            {staleEvent.incomingRevision} was older than current rev {staleEvent.currentRevision}.
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
          {isEditing ? (
            <>
              <Button variant="outlined" onClick={cancelEditing} disabled={isSaving || isOptimisticSaving}>
                Отмена
              </Button>
              <Button
                variant="outlined"
                onClick={() => saveDraft('optimistic')}
                disabled={isSaving || isOptimisticSaving || titleError || Boolean(conflictState)}
                startIcon={
                  isOptimisticSaving ? <CircularProgress color="inherit" size={16} /> : <SyncIcon />
                }
              >
                {isOptimisticSaving ? 'Ожидание...' : 'Сохранить optimistic'}
              </Button>
              <Button
                variant="contained"
                onClick={() => saveDraft('classic')}
                disabled={isSaving || isOptimisticSaving || titleError || Boolean(conflictState)}
                startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : undefined}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={runAsyncCompleteCommand}
                disabled={isSubmittingCommand || Boolean(workItem.pendingOperation || activeOperationId)}
                startIcon={
                  isSubmittingCommand ? <CircularProgress color="inherit" size={16} /> : <SyncIcon />
                }
              >
                {isSubmittingCommand ? 'Запуск...' : 'Запустить async complete'}
              </Button>
              <Button
                variant="contained"
                onClick={startEditing}
              >
                Редактировать
              </Button>
            </>
          )}
        </Stack>

        <Alert severity="info">
          Этап 11: details prefetched on hover/focus; состояние операций, revision и edge cases
          отображается без блокировки основного списка.
        </Alert>
      </Stack>
    </Paper>
  );
}

function WorkItemReadDetails({
  workItem,
  commandOperation,
}: {
  workItem: WorkItem;
  commandOperation: CommandOperation | undefined;
}) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <DetailItem label="Исполнитель" value={workItem.assignee ?? 'Без исполнителя'} />
        <DetailItem label="Revision" value={`rev ${workItem.revision}`} />
        <DetailItem label="Updated" value={formatDate(workItem.updatedAt)} />
        <DetailItem label="Pending operation" value={workItem.pendingOperation ?? 'Нет'} />
      </Grid>

      {workItem.pendingOperation || commandOperation ? (
        <Box sx={{ p: 1.5, bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Operation state</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                color={commandOperation?.status === 'failed' ? 'error' : 'secondary'}
                label={`operationId ${commandOperation?.operationId ?? workItem.pendingOperation}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`type complete`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`status ${commandOperation?.status ?? 'pending'}`}
              />
              {commandOperation?.createdAt ? (
                <Chip size="small" variant="outlined" label={`started ${formatDate(commandOperation.createdAt)}`} />
              ) : null}
            </Stack>
            {commandOperation?.error ? (
              <Typography variant="body2" color="error">
                {commandOperation.error}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      ) : null}

      <Stack spacing={1}>
        <Typography variant="subtitle2">Tags</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {workItem.tags.length ? (
            workItem.tags.map((tag) => <Chip key={tag} size="small" label={tag} />)
          ) : (
            <Typography variant="body2" color="text.secondary">
              Нет tags
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

function WorkItemEditForm({
  draft,
  disabled,
  titleError,
  onChange,
}: {
  draft: WorkItemDraft;
  disabled: boolean;
  titleError: boolean;
  onChange: <Key extends keyof WorkItemDraft>(key: Key, value: WorkItemDraft[Key]) => void;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        value={draft.title}
        onChange={(event) => onChange('title', event.target.value)}
        error={titleError}
        helperText={titleError ? 'Title не должен быть пустым.' : ' '}
        disabled={disabled}
        fullWidth
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="work-item-status-label">Status</InputLabel>
            <Select
              labelId="work-item-status-label"
              label="Status"
              value={draft.status}
              onChange={(event) => onChange('status', event.target.value as WorkItemStatus)}
            >
              {workItemStatusValues.map((status) => (
                <MenuItem key={status} value={status}>
                  {workItemStatusLabels[status]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="work-item-priority-label">Priority</InputLabel>
            <Select
              labelId="work-item-priority-label"
              label="Priority"
              value={draft.priority}
              onChange={(event) => onChange('priority', event.target.value as WorkItemPriority)}
            >
              {workItemPriorityValues.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {workItemPriorityLabels[priority]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TextField
        label="Assignee"
        value={draft.assignee}
        onChange={(event) => onChange('assignee', event.target.value)}
        disabled={disabled}
        fullWidth
      />

      <TextField
        label="Tags"
        value={draft.tags}
        onChange={(event) => onChange('tags', event.target.value)}
        helperText="Comma-separated values, for example: frontend, api, demo"
        disabled={disabled}
        fullWidth
      />
    </Stack>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={12} sm={4}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value}</Typography>
      </Stack>
    </Grid>
  );
}
