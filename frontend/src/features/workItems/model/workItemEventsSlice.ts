import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type StaleResponseEvent = {
  type: 'stale';
  workItemId: string;
  incomingRevision: number;
  currentRevision: number;
  source: 'list' | 'detail';
  ignoredAt: string;
};

export type WorkItemUiEvent =
  | StaleResponseEvent
  | {
      type: 'info' | 'success' | 'warning' | 'error';
      workItemId?: string;
      message: string;
      createdAt: string;
    };

type WorkItemEventsState = {
  lastStaleResponse: StaleResponseEvent | null;
  recentEvents: WorkItemUiEvent[];
};

const initialState: WorkItemEventsState = {
  lastStaleResponse: null,
  recentEvents: [],
};

const workItemEventsSlice = createSlice({
  name: 'workItemEvents',
  initialState,
  reducers: {
    staleResponseIgnored(
      state,
      action: PayloadAction<Omit<StaleResponseEvent, 'ignoredAt' | 'type'>>
    ) {
      const event = {
        ...action.payload,
        type: 'stale' as const,
        ignoredAt: new Date().toISOString(),
      };
      state.lastStaleResponse = event;
      state.recentEvents = [event, ...state.recentEvents].slice(0, 5);
    },
    workItemEventRecorded(
      state,
      action: PayloadAction<Omit<Exclude<WorkItemUiEvent, StaleResponseEvent>, 'createdAt'>>
    ) {
      state.recentEvents = [
        {
          ...action.payload,
          createdAt: new Date().toISOString(),
        },
        ...state.recentEvents,
      ].slice(0, 5);
    },
    clearStaleResponseEvent(state) {
      state.lastStaleResponse = null;
    },
    clearWorkItemEvents(state) {
      state.lastStaleResponse = null;
      state.recentEvents = [];
    },
  },
});

export const {
  clearStaleResponseEvent,
  clearWorkItemEvents,
  staleResponseIgnored,
  workItemEventRecorded,
} = workItemEventsSlice.actions;

export const workItemEventsReducer = workItemEventsSlice.reducer;
