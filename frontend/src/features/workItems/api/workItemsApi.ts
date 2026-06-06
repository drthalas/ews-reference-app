import { baseApi } from '../../../shared/api/baseApi';
import type { RootState } from '../../../app/store';
import type {
  CommandOperation,
  SubmitWorkItemCommandRequest,
  UpdateWorkItemRequest,
  WorkItem,
} from '../model/workItem';
import { staleResponseIgnored } from '../model/workItemEventsSlice';

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

function applyConfirmedWorkItem(workItem: WorkItem, confirmed: WorkItem) {
  Object.assign(workItem, confirmed);
}

function mergeWorkItemList(currentCache: WorkItem[], incomingItems: WorkItem[]) {
  const merged = incomingItems.map((incomingItem) => {
    const current = currentCache.find((workItem) => workItem.id === incomingItem.id);
    if (current && incomingItem.revision < current.revision) {
      return { ...current };
    }
    return incomingItem;
  });

  currentCache.splice(0, currentCache.length, ...merged);
}

function mergeWorkItemDetail(currentCache: WorkItem, incomingItem: WorkItem) {
  if (incomingItem.revision >= currentCache.revision) {
    applyConfirmedWorkItem(currentCache, incomingItem);
  }
}

function freshest(left: WorkItem | undefined, right: WorkItem | undefined) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  return right.revision > left.revision ? right : left;
}

export const workItemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkItems: builder.query<WorkItem[], void>({
      query: () => '/work-items',
      merge: mergeWorkItemList,
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const previous = workItemsApi.endpoints.getWorkItems.select()(getState() as RootState)
          .data;
        try {
          const { data: incomingItems } = await queryFulfilled;
          incomingItems.forEach((incomingItem) => {
            const state = getState() as RootState;
            const previousListItem = previous?.find((workItem) => workItem.id === incomingItem.id);
            const knownDetailItem =
              workItemsApi.endpoints.getWorkItem.select(incomingItem.id)(state).data;
            const current = freshest(previousListItem, knownDetailItem);
            if (current && incomingItem.revision < current.revision) {
              dispatch(
                staleResponseIgnored({
                  workItemId: incomingItem.id,
                  incomingRevision: incomingItem.revision,
                  currentRevision: current.revision,
                  source: 'list',
                })
              );
              dispatch(
                workItemsApi.util.updateQueryData('getWorkItems', undefined, (draft) => {
                  const index = draft.findIndex((workItem) => workItem.id === incomingItem.id);
                  if (index >= 0) {
                    draft[index] = current;
                  }
                })
              );
            }
          });
        } catch {
          // Normal error UI is handled by the query state.
        }
      },
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
      merge: mergeWorkItemDetail,
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const stateBefore = getState() as RootState;
        const previous = workItemsApi.endpoints.getWorkItem.select(id)(stateBefore).data;
        const previousFromList = workItemsApi.endpoints.getWorkItems
          .select()(stateBefore)
          .data?.find((workItem) => workItem.id === id);
        try {
          const { data: incomingItem } = await queryFulfilled;
          const current = freshest(previous, previousFromList);
          if (current && incomingItem.revision < current.revision) {
            dispatch(
              staleResponseIgnored({
                workItemId: incomingItem.id,
                incomingRevision: incomingItem.revision,
                currentRevision: current.revision,
                source: 'detail',
              })
            );
            dispatch(
              workItemsApi.util.updateQueryData('getWorkItem', id, (draft) => {
                applyConfirmedWorkItem(draft, current);
              })
            );
          }
        } catch {
          // Normal error UI is handled by the query state.
        }
      },
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
              applyConfirmedWorkItem(draft, confirmed);
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
