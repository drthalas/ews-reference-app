import { baseApi } from '../../../shared/api/baseApi';
import type {
  CommandOperation,
  SubmitWorkItemCommandRequest,
  UpdateWorkItemRequest,
  WorkItem,
} from '../model/workItem';

export type UpdateWorkItemArgs = {
  id: string;
  changes: UpdateWorkItemRequest;
};

export type SubmitWorkItemCommandArgs = {
  id: string;
  command: SubmitWorkItemCommandRequest;
};

function applyChanges(workItem: WorkItem, changes: UpdateWorkItemRequest) {
  if (changes.title !== undefined) {
    workItem.title = changes.title;
  }
  if (changes.status !== undefined) {
    workItem.status = changes.status;
  }
  if (changes.priority !== undefined) {
    workItem.priority = changes.priority;
  }
  if (changes.assignee !== undefined) {
    workItem.assignee = changes.assignee;
  }
  if (changes.tags !== undefined) {
    workItem.tags = changes.tags;
  }
}

export const workItemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkItems: builder.query<WorkItem[], void>({
      query: () => '/work-items',
      providesTags: (result) =>
        result
          ? [
              { type: 'WorkItem' as const, id: 'LIST' },
              ...result.map((workItem) => ({ type: 'WorkItem' as const, id: workItem.id })),
            ]
          : [{ type: 'WorkItem' as const, id: 'LIST' }],
    }),
    getWorkItem: builder.query<WorkItem, string>({
      query: (id) => `/work-items/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'WorkItem', id }],
    }),
    updateWorkItem: builder.mutation<WorkItem, UpdateWorkItemArgs>({
      query: ({ id, changes }) => ({
        url: `/work-items/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkItem', id },
        { type: 'WorkItem', id: 'LIST' },
      ],
    }),
    updateWorkItemOptimistic: builder.mutation<WorkItem, UpdateWorkItemArgs>({
      query: ({ id, changes }) => ({
        url: `/work-items/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      async onQueryStarted({ id, changes }, { dispatch, queryFulfilled }) {
        const listPatch = dispatch(
          workItemsApi.util.updateQueryData('getWorkItems', undefined, (draft) => {
            const item = draft.find((workItem) => workItem.id === id);
            if (item) {
              applyChanges(item, changes);
            }
          })
        );
        const detailPatch = dispatch(
          workItemsApi.util.updateQueryData('getWorkItem', id, (draft) => {
            applyChanges(draft, changes);
          })
        );

        try {
          const { data: confirmed } = await queryFulfilled;
          dispatch(
            workItemsApi.util.updateQueryData('getWorkItems', undefined, (draft) => {
              const index = draft.findIndex((workItem) => workItem.id === id);
              if (index >= 0) {
                draft[index] = confirmed;
              }
            })
          );
          dispatch(
            workItemsApi.util.updateQueryData('getWorkItem', id, (draft) => {
              Object.assign(draft, confirmed);
            })
          );
        } catch {
          listPatch.undo();
          detailPatch.undo();
        }
      },
    }),
    submitWorkItemCommand: builder.mutation<CommandOperation, SubmitWorkItemCommandArgs>({
      query: ({ id, command }) => ({
        url: `/work-items/${id}/commands`,
        method: 'POST',
        body: command,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkItem', id },
        { type: 'WorkItem', id: 'LIST' },
      ],
    }),
    getCommand: builder.query<CommandOperation, string>({
      query: (operationId) => `/commands/${operationId}`,
      providesTags: (_result, _error, operationId) => [{ type: 'Command', id: operationId }],
    }),
  }),
});

export const {
  useGetCommandQuery,
  useGetWorkItemQuery,
  useGetWorkItemsQuery,
  useSubmitWorkItemCommandMutation,
  useUpdateWorkItemOptimisticMutation,
  useUpdateWorkItemMutation,
} = workItemsApi;
