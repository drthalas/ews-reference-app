import { configureStore } from '@reduxjs/toolkit';
import { workItemEventsReducer } from '../features/workItems/model/workItemEventsSlice';
import { baseApi } from '../shared/api/baseApi';

export function createAppStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      workItemEvents: workItemEventsReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
