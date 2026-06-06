# RTK Query Policy

RTK Query is the default owner of server state.

The current frontend has a shared `baseApi`, a health endpoint, WorkItem query endpoints, polling options, server-confirmed and optimistic WorkItem update mutations, async command endpoints, and separate DEV panel mutations.

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
- UI-only WorkItem event state records ignored stale responses without copying server records into Redux slices.
- `getWorkItem` is prefetched on row hover/focus in Stage 11.

## Implemented WorkItem Endpoints

- `getWorkItems`: `GET /api/work-items`
- `getWorkItem`: `GET /api/work-items/{id}`
- `updateWorkItem`: `PATCH /api/work-items/{id}`
- `updateWorkItemOptimistic`: `PATCH /api/work-items/{id}`
- `submitWorkItemCommand`: `POST /api/work-items/{id}/commands`
- `getCommand`: `GET /api/commands/{operationId}`

## Implemented DEV Panel Endpoints

- `getDevSettings`: `GET /api/dev/settings`
- `updateDevSettings`: `PUT /api/dev/settings`
- `resetDevState`: `POST /api/dev/reset`
- `triggerExternalChange`: `POST /api/dev/work-items/{id}/external-change`
- `failNextRequest`: `POST /api/dev/fail-next-request`
- `failNextCommand`: `POST /api/dev/fail-next-command`
- `triggerStaleResponse`: `POST /api/dev/trigger-stale-response`
- `triggerConflict`: `POST /api/dev/trigger-conflict`

## Cache And Reconciliation

WorkItem list, detail, server-confirmed update, optimistic update, and async command flows are modeled through RTK Query endpoints. DEV panel actions are modeled through a separate feature API that shares the same `baseApi`. Prefetch flows should also be modeled through RTK Query when their stages begin.

Successful server-confirmed updates invalidate the relevant item and list tags so active list/detail queries refetch server-confirmed data. Optimistic updates should use RTK Query cache patching and define rollback behavior before implementation.

Stage 6 polling is configured at hook usage with a 3000 ms interval when enabled and `0` when disabled. Selected details prefer the item from the polled list cache when available, with the detail query as fallback.

Stage 7 optimistic update uses `onQueryStarted` and `updateQueryData` to patch both `getWorkItems` and `getWorkItem`. On success, both caches are replaced with the server-confirmed WorkItem. On error, both patches are undone. The UI pauses polling while an optimistic save is pending.

Stage 8 command submission invalidates the affected WorkItem and list cache so active queries can refetch `pendingOperation`. Command status is polled via `getCommand` while the operation is pending. The final WorkItem state is received through existing WorkItem polling.

Stage 10 stale response handling uses revision-aware `merge` policies on `getWorkItems` and `getWorkItem`. Incoming items are accepted when `incoming.revision >= cached.revision`; older incoming revisions are ignored. Detail responses are compared against detail and list cache, while list responses can also preserve a fresher known detail item. Ignored stale responses dispatch a UI-only event for badges/logs.

Successful DEV reset clears RTK Query cache so deterministic seed data with lower revisions can replace newer cached revisions.

Stage 11 prefetch uses `workItemsApi.usePrefetch('getWorkItem')` from row hover/focus handlers with `ifOlderThan`, so detail data is warmed without adding render-time network requests.
