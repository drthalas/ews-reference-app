# RTK Query Policy

RTK Query is the default owner of server state.

## Rules

- Define shared transport configuration in `shared/api/baseApi.ts`.
- Define feature endpoints inside feature modules.
- Prefer generated hooks in UI components.
- Use tags and invalidation when domain endpoints are added.
- Keep UI-only flags in Redux slices or local component state.

## Future Use

WorkItem list queries, mutations, command status queries, and prefetch flows should be modeled through RTK Query endpoints.
