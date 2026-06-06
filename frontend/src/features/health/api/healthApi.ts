import { baseApi } from '../../../shared/api/baseApi';

export type HealthResponse = {
  status: string;
  service: string;
};

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => '/health',
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
