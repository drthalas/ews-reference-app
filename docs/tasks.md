# Task Map

This file is the compact execution map for future work.

## Stage Status

| Stage | Status | Scope |
| --- | --- | --- |
| 1. Initial scaffold | Done | React/Vite frontend, Spring Boot backend, health check, Docker Compose, initial docs. |
| 2. Architecture docs refinement | Done | Compact context, task map, API plans, policies, demo scenarios, and roadmap. |
| 3. Backend WorkItem API | Done | In-memory domain model, list/detail/update endpoints, validation, errors, and tests. |
| 4. Frontend RTK Query integration | Done | WorkItem models, feature API bindings, generated hooks, list rendering, and read-only detail panel. |
| 5. Server-confirmed update | Done | PATCH UI, saving state, success/error feedback, and RTK Query cache invalidation. |
| 6. Polling | Done | Polling controls, interval refresh, external-change support, and visual polling state. |
| 6.5. Railway demo deploy | Done | Railway-ready backend/frontend runtime config and manual deploy runbook. |
| 7. Optimistic update | Done | Optimistic mutation, pending state, rollback, and failed-change feedback. |
| 8. Async command flow | Done | Command submission, operation status, delayed completion, and pending operation UI. |
| 9. DEV panel | Next | Local controls for delays, failures, reset, external change, stale response, and conflict demos. |

## Execution Order

1. Finish Stage 2 documentation and keep implementation untouched.
2. Add the backend WorkItem domain package and in-memory repository.
3. Add main WorkItem endpoints and OpenAPI-visible DTOs.
4. Add backend tests for list, detail, patch, validation, and errors.
5. Add frontend WorkItem RTK Query endpoints and typed models.
6. Add compact WorkItem list UI and server-confirmed edit flow.
7. Add polling controls and external-change demo support.
8. Prepare Railway demo deploy for separate frontend and backend services.
9. Add optimistic update flow with rollback and reconciliation.
10. Add async command flow with command status lookup.
11. Add DEV settings and simulation endpoints.
12. Add conflict and stale response scenarios.
13. Add prefetch scenario.
14. Add final demo documentation and broader tests.

## Completed Stage 3 Checklist

- Added backend WorkItem packages under `workitem/api`, `workitem/domain`, `workitem/service`, and `workitem/storage`.
- Added deterministic in-memory seed data.
- Added `GET /api/work-items`.
- Added `GET /api/work-items/{id}`.
- Added `PATCH /api/work-items/{id}`.
- Added validation, revision increment on actual change, updated timestamps, and consistent `ApiError`.
- Added backend MockMvc coverage for list, detail, patch, revision, not found, and validation behavior.

## Completed Stage 4 Checklist

- Added `features/workItems/model` with WorkItem, status, and priority types.
- Added `features/workItems/api` with `getWorkItems` and `getWorkItem` endpoints injected into the shared RTK Query API.
- Added `features/workItems/ui` with read-only list, selected item details, loading, error, and empty states.
- Added status and priority badges, revision display, updatedAt display, and tags.
- Integrated WorkItems UI into the main app while keeping backend health status visible.
- Kept editing, PATCH UI, polling, optimistic updates, async commands, DEV panel, and conflict scenarios out of scope.

## Completed Stage 5 Checklist

- Added `updateWorkItem` RTK Query mutation for `PATCH /api/work-items/{id}`.
- Added details edit mode with title, status, priority, assignee, and comma-separated tags.
- Added Save and Cancel actions.
- Added saving state that disables edit controls and waits for backend confirmation.
- Added success and error feedback without discarding unsaved user input on errors.
- Invalidated WorkItem list and selected detail cache entries after successful mutation.
- Kept optimistic update, polling, async commands, DEV panel, and conflict scenarios out of scope.

## Completed Stage 6 Checklist

- Added `POST /api/dev/work-items/{id}/external-change` as a minimal local demo helper.
- Reused WorkItem service logic for deterministic external changes, revision increment, and `updatedAt` refresh.
- Added backend coverage for unknown ids, deterministic update behavior, revision increment, and timestamp update.
- Added a `triggerExternalChange` RTK Query mutation for the demo endpoint.
- Added WorkItem polling controls with a 3000 ms interval and visible polling status.
- Added last refresh display, manual refresh, and external-change feedback.
- Kept optimistic update, rollback, async commands, full DEV panel, and conflict/stale scenarios out of scope.

## Completed Stage 6.5 Checklist

- Added Railway-compatible backend `PORT` configuration.
- Added backend CORS origins via `ALLOWED_ORIGINS` with local development defaults.
- Replaced frontend Docker runtime with a production static nginx container.
- Added frontend Docker build support for `VITE_API_BASE_URL`.
- Updated Docker Compose to pass frontend API base URL at build time and local runtime port at container start.
- Added Russian Railway deploy runbook in `docs/deploy-railway.md`.
- Kept actual Railway service creation as a manual step unless Railway CLI is available and authorized.

## Completed Stage 7 Checklist

- Added minimal `POST /api/dev/fail-next-request` support for one-shot WorkItem PATCH failure demos.
- Added `DEV_FORCED_FAILURE` ApiError handling.
- Added backend tests for fail-next arming, one-shot failure, reset behavior, and normal PATCH revision increment.
- Added `updateWorkItemOptimistic` RTK Query mutation using `onQueryStarted` and `updateQueryData`.
- Patched both `getWorkItems` and `getWorkItem` caches optimistically.
- Replaced optimistic cache entries with server-confirmed data on success.
- Undid optimistic cache patches on backend error and showed rollback feedback.
- Added optimistic/pending badge and a fail-next-request demo button.
- Preserved the Stage 5 server-confirmed save path without optimistic cache patching.
- Paused polling while an optimistic save is pending to avoid obvious stale visual overwrite.

## Completed Stage 8 Checklist

- Added `pendingOperation` to the WorkItem contract.
- Added `POST /api/work-items/{id}/commands` with `202 Accepted`.
- Added `GET /api/commands/{operationId}`.
- Added in-memory command operation storage with deterministic `op-N` ids.
- Added delayed single-process completion for the `complete` command.
- Marked WorkItems with `pendingOperation` when commands are accepted.
- Completed commands clear `pendingOperation`, set status to `done`, increment revision, and update `updatedAt`.
- Added backend tests for submit, pending state, command status, delayed completion, invalid command payloads, and not-found errors.
- Added RTK Query `submitWorkItemCommand` and `getCommand` endpoints.
- Added frontend command submit control, pending badge, command status polling, and final-state polling behavior.
- Kept Redis, external queues, WebSocket, auth, conflict handling, and full DEV panel out of scope.

## Future Implementation Guardrails

- Do not add persistence beyond in-memory storage.
- Do not add auth, external queues, external workers, WebSocket flows, or multi-user behavior.
- Keep endpoint contracts small and explicit.
- Add tests as each runtime behavior is introduced.
