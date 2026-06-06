import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#246b59',
    },
    secondary: {
      main: '#7a4f21',
    },
    background: {
      default: '#f7f8f6',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
