import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { useGetHealthQuery } from '../api/healthApi';

export function HealthCheck() {
  const { data, error, isLoading, isFetching } = useGetHealthQuery();

  if (isLoading) {
    return (
      <Alert icon={<HourglassEmptyIcon />} severity="info">
        Backend health: loading
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert icon={<ErrorOutlineIcon />} severity="error">
        Backend health: unavailable
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <Chip
          icon={<CheckCircleIcon />}
          label={`Backend: ${data?.status ?? 'unknown'}`}
          color="success"
          variant="outlined"
        />
        <Typography variant="body2" color="text.secondary">
          Service: {data?.service ?? 'unknown'}
          {isFetching ? ' / health refresh' : ''}
        </Typography>
      </Stack>
    </Box>
  );
}
