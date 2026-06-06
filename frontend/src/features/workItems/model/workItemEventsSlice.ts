import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type StaleResponseEvent = {
  workItemId: string;
  incomingRevision: number;
  currentRevision: number;
  source: 'list' | 'detail';
  ignoredAt: string;
};

type WorkItemEventsState = {
  lastStaleResponse: StaleResponseEvent | null;
};

const initialState: WorkItemEventsState = {
  lastStaleResponse: null,
};

const workItemEventsSlice = createSlice({
  name: 'workItemEvents',
  initialState,
  reducers: {
    staleResponseIgnored(state, action: PayloadAction<Omit<StaleResponseEvent, 'ignoredAt'>>) {
      state.lastStaleResponse = {
        ...action.payload,
        ignoredAt: new Date().toISOString(),
      };
    },
    clearStaleResponseEvent(state) {
      state.lastStaleResponse = null;
    },
  },
});

export const { clearStaleResponseEvent, staleResponseIgnored } = workItemEventsSlice.actions;

export const workItemEventsReducer = workItemEventsSlice.reducer;
