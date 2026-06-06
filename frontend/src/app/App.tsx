import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Button, Chip, Container, Divider, Stack, Typography } from '@mui/material';
import { HealthCheck } from '../features/health/ui/HealthCheck';

export function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        <Stack spacing={4}>
          <Stack spacing={1.5}>
            <Typography component="h1" variant="h3" sx={{ fontWeight: 700 }}>
              EWS Reference App
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720 }}>
              Initial scaffold for frontend-backend reference patterns
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Chip
              icon={<CheckCircleIcon />}
              label="Frontend status: ready"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
            <HealthCheck />
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
              Backend API documentation is available through Swagger.
            </Typography>
            <Button
              href="http://localhost:8080/swagger-ui.html"
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
