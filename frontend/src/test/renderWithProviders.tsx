import { ThemeProvider, createTheme } from '@mui/material';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { createAppStore, type AppStore } from '../app/store';

const theme = createTheme();

export function renderWithProviders(ui: ReactElement, store: AppStore = createAppStore()) {
  const view = render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </Provider>
  );

  return { store, ...view };
}
