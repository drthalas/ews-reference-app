import { configureStore } from '@reduxjs/toolkit';
import { workItemEventsReducer } from '../features/workItems/model/workItemEventsSlice';
import { baseApi } from '../shared/api/baseApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    workItemEvents: workItemEventsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
