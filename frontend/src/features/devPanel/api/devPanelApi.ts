import { baseApi } from '../../../shared/api/baseApi';
import { clearWorkItemEvents } from '../../workItems/model/workItemEventsSlice';
import type {
  DevActionResult,
  DevSettings,
  TriggerExternalChangeArgs,
  TriggerExternalChangeResult,
  UpdateDevSettingsRequest,
} from '../model/devSettings';

export const devPanelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDevSettings: builder.query<DevSettings, void>({
      query: () => '/dev/settings',
      providesTags: [{ type: 'DevSettings', id: 'CURRENT' }],
    }),
    updateDevSettings: builder.mutation<DevSettings, UpdateDevSettingsRequest>({
      query: (settings) => ({
        url: '/dev/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: [{ type: 'DevSettings', id: 'CURRENT' }],
    }),
    resetDevState: builder.mutation<DevSettings, void>({
      query: () => ({
        url: '/dev/reset',
        method: 'POST',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearWorkItemEvents());
          dispatch(baseApi.util.resetApiState());
        } catch {
          // The panel shows the mutation error; cache is only cleared after a confirmed reset.
        }
      },
      invalidatesTags: [
        { type: 'DevSettings', id: 'CURRENT' },
        { type: 'WorkItem', id: 'LIST' },
      ],
    }),
    triggerExternalChange: builder.mutation<
      TriggerExternalChangeResult,
      TriggerExternalChangeArgs
    >({
      query: ({ id }) => ({
        url: `/dev/work-items/${id}/external-change`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkItem', id },
        { type: 'WorkItem', id: 'LIST' },
      ],
    }),
    failNextRequest: builder.mutation<DevActionResult, void>({
      query: () => ({
        url: '/dev/fail-next-request',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'DevSettings', id: 'CURRENT' }],
    }),
    failNextCommand: builder.mutation<DevActionResult, void>({
      query: () => ({
        url: '/dev/fail-next-command',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'DevSettings', id: 'CURRENT' }],
    }),
    triggerStaleResponse: builder.mutation<DevActionResult, void>({
      query: () => ({
        url: '/dev/trigger-stale-response',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'DevSettings', id: 'CURRENT' }],
    }),
    triggerConflict: builder.mutation<DevActionResult, void>({
      query: () => ({
        url: '/dev/trigger-conflict',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'DevSettings', id: 'CURRENT' }],
    }),
  }),
});

export const {
  useFailNextCommandMutation,
  useFailNextRequestMutation,
  useGetDevSettingsQuery,
  useResetDevStateMutation,
  useTriggerConflictMutation,
  useTriggerExternalChangeMutation,
  useTriggerStaleResponseMutation,
  useUpdateDevSettingsMutation,
} = devPanelApi;
