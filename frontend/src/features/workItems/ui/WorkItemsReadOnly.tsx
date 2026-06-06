import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useState } from 'react';
import { useGetWorkItemQuery, useGetWorkItemsQuery } from '../api/workItemsApi';
import {
  workItemPriorityLabels,
  workItemStatusLabels,
  type WorkItem,
  type WorkItemPriority,
  type WorkItemStatus,
} from '../model/workItem';

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function WorkItemsReadOnly() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    data: workItems,
    error: listError,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch,
  } = useGetWorkItemsQuery();

  useEffect(() => {
    if (!selectedId && workItems?.length) {
      setSelectedId(workItems[0].id);
    }
  }, [selectedId, workItems]);

  const selectedFromList = useMemo(
    () => workItems?.find((workItem) => workItem.id === selectedId) ?? null,
    [selectedId, workItems]
  );

  const {
    data: selectedDetails,
    error: detailsError,
    isLoading: isDetailsLoading,
    isFetching: isDetailsFetching,
  } = useGetWorkItemQuery(selectedId ?? skipToken);

  const selectedWorkItem = selectedDetails ?? selectedFromList;

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
        Этап 4: read-only frontend integration. Editing will be added in the next stage.
      </Alert>

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
}: {
  workItem: WorkItem | null;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
}) {
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

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Stack spacing={2}>
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

        <Alert severity="info">
          This panel is read-only. Editing controls and server-confirmed updates are planned for
          Этап 5.
        </Alert>
      </Stack>
    </Paper>
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
