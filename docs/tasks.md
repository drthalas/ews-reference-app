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
| 7. Optimistic update | Next | Optimistic mutation, pending state, rollback, and failed-change feedback. |

## Execution Order

1. Finish Stage 2 documentation and keep implementation untouched.
2. Add the backend WorkItem domain package and in-memory repository.
3. Add main WorkItem endpoints and OpenAPI-visible DTOs.
4. Add backend tests for list, detail, patch, validation, and errors.
5. Add frontend WorkItem RTK Query endpoints and typed models.
6. Add compact WorkItem list UI and server-confirmed edit flow.
7. Add polling controls and external-change demo support.
8. Add optimistic update flow with rollback and reconciliation.
9. Add async command flow with command status lookup.
10. Add DEV settings and simulation endpoints.
11. Add conflict and stale response scenarios.
12. Add prefetch scenario.
13. Add final demo documentation and broader tests.

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

## Future Implementation Guardrails

- Do not add persistence beyond in-memory storage.
- Do not add auth, external queues, external workers, WebSocket flows, or multi-user behavior.
- Keep endpoint contracts small and explicit.
- Add tests as each runtime behavior is introduced.
