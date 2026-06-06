import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Button, Chip, Container, Divider, Stack, Typography } from '@mui/material';
import { HealthCheck } from '../features/health/ui/HealthCheck';
import { WorkItemsReadOnly } from '../features/workItems/ui/WorkItemsReadOnly';
import { swaggerUrl } from '../shared/config/runtime';

export function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <Stack spacing={1.5}>
            <Typography component="h1" variant="h3" sx={{ fontWeight: 700 }}>
              EWS Reference App
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720 }}>
              Этап 11: Prefetch и UX polish
            </Typography>
          </Stack>

          <Stack spacing={2.5}>
            <Chip
              icon={<CheckCircleIcon />}
              label="Frontend: ready"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
            <HealthCheck />
            <WorkItemsReadOnly />
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
              Backend API documentation доступна через Swagger.
            </Typography>
            <Button
              href={swaggerUrl}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              endIcon={<OpenInNewIcon />}
            >
              Swagger
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
