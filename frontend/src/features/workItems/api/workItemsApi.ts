import { baseApi } from '../../../shared/api/baseApi';
import type { WorkItem } from '../model/workItem';

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
  }),
});

export const { useGetWorkItemQuery, useGetWorkItemsQuery } = workItemsApi;
