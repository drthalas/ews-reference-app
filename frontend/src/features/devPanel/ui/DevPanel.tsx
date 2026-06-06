import BugReportIcon from '@mui/icons-material/BugReport';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  useFailNextCommandMutation,
  useFailNextRequestMutation,
  useGetDevSettingsQuery,
  useResetDevStateMutation,
  useTriggerConflictMutation,
  useTriggerExternalChangeMutation,
  useTriggerStaleResponseMutation,
  useUpdateDevSettingsMutation,
} from '../api/devPanelApi';
import type { DevSettings } from '../model/devSettings';
import type { ApiError } from '../../workItems/model/workItem';

type DevPanelProps = {
  selectedWorkItemId: string | null;
  onRefreshWorkItems: () => void;
};

const delayOptions = [0, 500, 1500, 3000, 5000];

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: ApiError }).data;
    if (data?.message || data?.code) {
      return [data.code, data.message].filter(Boolean).join(': ');
    }
  }

  return fallback;
}

function formatSettings(settings: DevSettings) {
  return [
    `delay ${settings.responseDelayMs} ms`,
    settings.failNextRequest ? 'fail-next-request armed' : 'request normal',
    settings.failNextCommand ? 'fail-next-command armed' : 'command normal',
    settings.staleResponseMode ? 'stale mode on' : 'stale one-shot/off',
    settings.conflictMode ? 'conflict mode on' : 'conflict one-shot/off',
    `last: ${settings.lastDevAction}`,
  ].join(' / ');
}

export function DevPanel({ selectedWorkItemId, onRefreshWorkItems }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [responseDelayMs, setResponseDelayMs] = useState(0);
  const [staleResponseMode, setStaleResponseMode] = useState(false);
  const [conflictMode, setConflictMode] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  );

  const { data: settings, error: settingsError, isFetching: isSettingsFetching } =
    useGetDevSettingsQuery(undefined, { skip: !open });
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateDevSettingsMutation();
  const [resetDevState, { isLoading: isResetting }] = useResetDevStateMutation();
  const [triggerExternalChange, { isLoading: isExternalChanging }] =
    useTriggerExternalChangeMutation();
  const [failNextRequest, { isLoading: isFailingRequest }] = useFailNextRequestMutation();
  const [failNextCommand, { isLoading: isFailingCommand }] = useFailNextCommandMutation();
  const [triggerStaleResponse, { isLoading: isTriggeringStale }] =
    useTriggerStaleResponseMutation();
  const [triggerConflict, { isLoading: isTriggeringConflict }] = useTriggerConflictMutation();

  useEffect(() => {
    if (!settings) {
      return;
    }
    setResponseDelayMs(settings.responseDelayMs);
    setStaleResponseMode(settings.staleResponseMode);
    setConflictMode(settings.conflictMode);
  }, [settings]);

  const isBusy =
    isSavingSettings ||
    isResetting ||
    isExternalChanging ||
    isFailingRequest ||
    isFailingCommand ||
    isTriggeringStale ||
    isTriggeringConflict;

  const runAction = async (label: string, action: () => Promise<unknown>, refresh = false) => {
    setFeedback(null);
    try {
      await action();
      if (refresh) {
        onRefreshWorkItems();
      }
      setFeedback({ severity: 'success', message: label });
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: getErrorMessage(error, 'DEV action не выполнен. Проверьте backend и повторите.'),
      });
    }
  };

  const saveSettings = () =>
    runAction(
      'DEV settings сохранены.',
      () =>
        updateSettings({
          responseDelayMs,
          staleResponseMode,
          conflictMode,
        }).unwrap()
    );

  const resetState = () =>
    runAction('Backend state сброшен к deterministic seed data.', () => resetDevState().unwrap(), true);

  return (
    <>
      <Button variant="outlined" startIcon={<BugReportIcon />} onClick={() => setOpen(true)}>
        DEV panel
      </Button>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 2.5 }} role="presentation">
          <Stack spacing={2.5}>
            <Stack spacing={0.75}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BugReportIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  DEV panel
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Локальные demo controls для ошибок, конфликтов, stale responses и reset.
              </Typography>
            </Stack>

            {settingsError ? (
              <Alert severity="error">
                DEV settings не загрузились. Проверьте backend и повторите действие.
              </Alert>
            ) : null}
            {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                label={isSettingsFetching ? 'settings refresh' : 'settings ready'}
                color={settingsError ? 'error' : 'primary'}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`selected: ${selectedWorkItemId ?? 'none'}`}
                variant="outlined"
              />
            </Stack>

            <Divider />

            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Settings
              </Typography>
              <FormControl fullWidth disabled={isBusy}>
                <InputLabel id="dev-delay-label">Backend delay</InputLabel>
                <Select
                  labelId="dev-delay-label"
                  label="Backend delay"
                  value={responseDelayMs}
                  onChange={(event) => setResponseDelayMs(Number(event.target.value))}
                >
                  {delayOptions.map((delay) => (
                    <MenuItem key={delay} value={delay}>
                      {delay} ms
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={staleResponseMode}
                    onChange={(event) => setStaleResponseMode(event.target.checked)}
                    disabled={isBusy}
                  />
                }
                label="Stale response mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={conflictMode}
                    onChange={(event) => setConflictMode(event.target.checked)}
                    disabled={isBusy}
                  />
                }
                label="Conflict mode"
              />
              <Button
                variant="contained"
                startIcon={isSavingSettings ? <CircularProgress color="inherit" size={16} /> : <SaveIcon />}
                onClick={saveSettings}
                disabled={isBusy}
              >
                Сохранить settings
              </Button>
            </Stack>

            <Divider />

            <Stack spacing={1.25}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                One-shot actions
              </Typography>
              <Button
                variant="outlined"
                startIcon={<WarningAmberIcon />}
                disabled={isBusy}
                onClick={() =>
                  runAction('Следующий WorkItem PATCH вернёт DEV_FORCED_FAILURE.', () =>
                    failNextRequest().unwrap()
                  )
                }
              >
                Fail next request
              </Button>
              <Button
                variant="outlined"
                startIcon={<SyncProblemIcon />}
                disabled={isBusy}
                onClick={() =>
                  runAction('Следующая async command завершится failed.', () =>
                    failNextCommand().unwrap()
                  )
                }
              >
                Fail next command
              </Button>
              <Button
                variant="outlined"
                disabled={isBusy}
                onClick={() =>
                  runAction('Следующий WorkItem read вернёт controlled stale response.', () =>
                    triggerStaleResponse().unwrap()
                  )
                }
              >
                Trigger stale response
              </Button>
              <Button
                variant="outlined"
                disabled={isBusy}
                onClick={() =>
                  runAction('Следующий WorkItem PATCH вернёт DEV_CONFLICT.', () =>
                    triggerConflict().unwrap()
                  )
                }
              >
                Trigger conflict
              </Button>
              <Button
                variant="outlined"
                disabled={isBusy || !selectedWorkItemId}
                onClick={() =>
                  runAction(
                    `External change применён к ${selectedWorkItemId}.`,
                    () => triggerExternalChange({ id: selectedWorkItemId as string }).unwrap(),
                    true
                  )
                }
              >
                External change для selected WorkItem
              </Button>
              <Button
                color="warning"
                variant="contained"
                startIcon={isResetting ? <CircularProgress color="inherit" size={16} /> : <RestartAltIcon />}
                disabled={isBusy}
                onClick={resetState}
              >
                Reset backend state
              </Button>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Current settings
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  overflow: 'auto',
                }}
              >
                {settings ? formatSettings(settings) : 'Settings not loaded'}
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
