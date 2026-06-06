import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../config/runtime';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiBaseUrl}/api`,
  }),
  tagTypes: ['WorkItem', 'Command', 'DevSettings'],
  endpoints: () => ({}),
});
