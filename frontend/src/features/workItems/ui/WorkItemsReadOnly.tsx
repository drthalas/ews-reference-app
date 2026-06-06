import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
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
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useState } from 'react';
import {
  useGetWorkItemQuery,
  useGetWorkItemsQuery,
  useTriggerExternalChangeMutation,
  useUpdateWorkItemMutation,
} from '../api/workItemsApi';
import {
  workItemPriorityLabels,
  workItemPriorityValues,
  workItemStatusLabels,
  workItemStatusValues,
  type ApiError,
  type UpdateWorkItemRequest,
  type WorkItem,
  type WorkItemPriority,
  type WorkItemStatus,
} from '../model/workItem';

type WorkItemDraft = {
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee: string;
  tags: string;
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
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: ApiError }).data;
    if (data?.message || data?.code) {
      return [data.code, data.message].filter(Boolean).join(': ');
    }
  }

  return fallback;
}

export function WorkItemsReadOnly() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const pollingInterval = isPollingEnabled ? POLLING_INTERVAL_MS : 0;
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
  } = useGetWorkItemQuery(selectedId ?? skipToken, { pollingInterval });

  const selectedWorkItem = selectedFromList ?? selectedDetails ?? null;

  if (isListLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={22} />
          <Typography>Loading WorkItems</Typography>
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
        WorkItems are unavailable. Check that the backend is running and try again.
      </Alert>
    );
  }

  if (!workItems?.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1} alignItems="flex-start">
          <AssignmentTurnedInIcon color="disabled" />
          <Typography variant="h6">No WorkItems</Typography>
          <Typography color="text.secondary">
            The backend returned an empty list. Seed data should appear here when the API is ready.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info" icon={<InfoOutlinedIcon />}>
        Этап 6: polling обновляет данные с backend без ручного refresh. Optimistic update,
        rollback и conflict/stale сценарии будут добавлены позже.
      </Alert>

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
              label={isListFetching ? 'Polling refresh...' : `${POLLING_INTERVAL_MS / 1000}s interval`}
              color={isPollingEnabled ? 'primary' : 'default'}
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Last refresh: {lastRefreshAt ? formatDate(lastRefreshAt) : 'not yet'}
            </Typography>
            <Button size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}>
              Refresh
            </Button>
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
              <List disablePadding>
                {workItems.map((workItem) => (
                  <WorkItemListRow
                    key={workItem.id}
                    workItem={workItem}
                    selected={workItem.id === selectedId}
                    onSelect={() => setSelectedId(workItem.id)}
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
            isPollingEnabled={isPollingEnabled}
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
}: {
  workItem: WorkItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onSelect}
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
            </Stack>
          </Stack>
        }
        secondary={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {workItem.assignee ? `Assignee: ${workItem.assignee}` : 'Unassigned'}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

function WorkItemDetails({
  workItem,
  isLoading,
  isFetching,
  hasError,
  isPollingEnabled,
}: {
  workItem: WorkItem | null;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
  isPollingEnabled: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<WorkItemDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateWorkItem, { isLoading: isSaving }] = useUpdateWorkItemMutation();
  const [triggerExternalChange, { isLoading: isChangingExternally }] =
    useTriggerExternalChangeMutation();

  useEffect(() => {
    if (workItem && !isEditing) {
      setDraft(toDraft(workItem));
    }
  }, [isEditing, workItem]);

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={22} />
          <Typography>Loading selected WorkItem</Typography>
        </Stack>
      </Paper>
    );
  }

  if (hasError) {
    return (
      <Alert severity="error" icon={<ErrorOutlineIcon />}>
        Selected WorkItem details could not be loaded.
      </Alert>
    );
  }

  if (!workItem) {
    return (
      <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
        <Typography color="text.secondary">Select a WorkItem to see details.</Typography>
      </Paper>
    );
  }

  const activeDraft = draft ?? toDraft(workItem);
  const titleError = !activeDraft.title.trim();

  const startEditing = () => {
    setDraft(toDraft(workItem));
    setFormError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(toDraft(workItem));
    setFormError(null);
    setIsEditing(false);
  };

  const updateDraft = <Key extends keyof WorkItemDraft>(key: Key, value: WorkItemDraft[Key]) => {
    setDraft((current) => ({ ...(current ?? toDraft(workItem)), [key]: value }));
    setFormError(null);
  };

  const saveDraft = async () => {
    const trimmedTitle = activeDraft.title.trim();
    if (!trimmedTitle) {
      setFormError('Title не должен быть пустым.');
      return;
    }

    const changes: UpdateWorkItemRequest = {
      title: trimmedTitle,
      status: activeDraft.status,
      priority: activeDraft.priority,
      assignee: activeDraft.assignee.trim() || null,
      tags: parseTags(activeDraft.tags),
    };

    try {
      const saved = await updateWorkItem({ id: workItem.id, changes }).unwrap();
      setDraft(toDraft(saved));
      setFormError(null);
      setSuccessMessage('Изменения сохранены');
      setIsEditing(false);
    } catch (error) {
      setFormError(
        getMutationErrorMessage(
          error,
          'Не удалось сохранить изменения. Проверьте данные и повторите попытку.'
        )
      );
    }
  };

  const runExternalChange = async () => {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await triggerExternalChange(workItem.id).unwrap();
      setSuccessMessage(
        isPollingEnabled
          ? 'Внешнее изменение выполнено. Polling подтянет обновлённые данные с backend.'
          : 'Внешнее изменение выполнено. Включите polling или нажмите Refresh, чтобы подтянуть данные.'
      );
    } catch (error) {
      setFormError(
        getMutationErrorMessage(
          error,
          'Не удалось выполнить внешнее изменение. Проверьте backend и повторите попытку.'
        )
      );
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Stack spacing={2}>
        {isSaving ? <LinearProgress /> : null}
        {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {workItem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {workItem.id}
              {isFetching ? ' / refreshing details' : ''}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
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
            disabled={isSaving}
            titleError={titleError}
            onChange={updateDraft}
          />
        ) : (
          <WorkItemReadDetails workItem={workItem} />
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
          {isEditing ? (
            <>
              <Button variant="outlined" onClick={cancelEditing} disabled={isSaving}>
                Отмена
              </Button>
              <Button
                variant="contained"
                onClick={saveDraft}
                disabled={isSaving || titleError}
                startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : undefined}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={runExternalChange}
                disabled={isChangingExternally}
                startIcon={
                  isChangingExternally ? <CircularProgress color="inherit" size={16} /> : <SyncIcon />
                }
              >
                {isChangingExternally ? 'Изменение...' : 'Имитировать внешнее изменение'}
              </Button>
              <Button variant="contained" onClick={startEditing}>
                Редактировать
              </Button>
            </>
          )}
        </Stack>

        <Alert severity="info">
          Этап 6 uses regular polling. The demo action changes backend state externally;
          the list and selected details refresh from backend data instead of local optimistic state.
        </Alert>
      </Stack>
    </Paper>
  );
}

function WorkItemReadDetails({ workItem }: { workItem: WorkItem }) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <DetailItem label="Assignee" value={workItem.assignee ?? 'Unassigned'} />
        <DetailItem label="Revision" value={`rev ${workItem.revision}`} />
        <DetailItem label="Updated" value={formatDate(workItem.updatedAt)} />
      </Grid>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Tags</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {workItem.tags.length ? (
            workItem.tags.map((tag) => <Chip key={tag} size="small" label={tag} />)
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tags
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
