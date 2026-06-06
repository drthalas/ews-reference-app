import { baseApi } from '../../../shared/api/baseApi';
import type { UpdateWorkItemRequest, WorkItem } from '../model/workItem';

export type UpdateWorkItemArgs = {
  id: string;
  changes: UpdateWorkItemRequest;
};

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
  }),
});

export const { useGetWorkItemQuery, useGetWorkItemsQuery, useUpdateWorkItemMutation } =
  workItemsApi;
