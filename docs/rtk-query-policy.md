# RTK Query Policy

RTK Query is the default owner of server state.

The current frontend has a shared `baseApi`, a health endpoint, WorkItem query endpoints, polling options, a server-confirmed WorkItem update mutation, and a minimal external-change demo mutation.

## Rules

- Define shared transport configuration in `shared/api/baseApi.ts`.
- Define feature endpoints inside feature modules.
- Prefer generated hooks in UI components.
- Use tags and invalidation when domain endpoints are added.
- Keep UI-only flags in Redux slices or local component state.
- Do not mirror server records in Redux UI slices.
- Keep endpoint response and request types close to the feature API.

## Planned Tags

WorkItem endpoints use tags that support narrow invalidation:

- `WorkItem` with `LIST` for list refresh.
- `WorkItem` with item id for single-item updates.
- `Command` with operation id for async command status.

## Implemented WorkItem Endpoints

- `getWorkItems`: `GET /api/work-items`
- `getWorkItem`: `GET /api/work-items/{id}`
- `updateWorkItem`: `PATCH /api/work-items/{id}`
- `triggerExternalChange`: `POST /api/dev/work-items/{id}/external-change`

## Planned Command Endpoints

- `submitWorkItemCommand`: `POST /api/work-items/{id}/commands`
- `getCommand`: `GET /api/commands/{operationId}`

## Cache And Reconciliation

WorkItem list, detail, server-confirmed update, and external-change demo flows are modeled through RTK Query endpoints. Command status queries and prefetch flows should also be modeled through RTK Query when their stages begin.

Successful server-confirmed updates invalidate the relevant item and list tags so active list/detail queries refetch server-confirmed data. Optimistic updates should use RTK Query cache patching and define rollback behavior before implementation.

Stage 6 polling is configured at hook usage with a 3000 ms interval when enabled and `0` when disabled. Selected details prefer the item from the polled list cache when available, with the detail query as fallback.

Stale responses should not overwrite a newer known WorkItem revision once the conflict/stale stage adds explicit stale response handling.
