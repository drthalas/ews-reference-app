# RTK Query Policy

RTK Query is the default owner of server state.

The current scaffold has a shared `baseApi` and a health endpoint. WorkItem endpoints are planned for later stages.

## Rules

- Define shared transport configuration in `shared/api/baseApi.ts`.
- Define feature endpoints inside feature modules.
- Prefer generated hooks in UI components.
- Use tags and invalidation when domain endpoints are added.
- Keep UI-only flags in Redux slices or local component state.
- Do not mirror server records in Redux UI slices.
- Keep endpoint response and request types close to the feature API.

## Planned Tags

Future WorkItem endpoints should use tags that support narrow invalidation:

- `WorkItem` with `LIST` for list refresh.
- `WorkItem` with item id for single-item updates.
- `Command` with operation id for async command status.

## Planned Endpoints

- `getWorkItems`: `GET /api/work-items`
- `getWorkItem`: `GET /api/work-items/{id}`
- `updateWorkItem`: `PATCH /api/work-items/{id}`
- `submitWorkItemCommand`: `POST /api/work-items/{id}/commands`
- `getCommand`: `GET /api/commands/{operationId}`

## Cache And Reconciliation

WorkItem list queries, mutations, command status queries, and prefetch flows should be modeled through RTK Query endpoints.

Successful server-confirmed updates should update the relevant item cache and invalidate list data when list ordering or filtering could change. Optimistic updates should use RTK Query cache patching and define rollback behavior before implementation.

Stale responses should not overwrite a newer known WorkItem revision.
