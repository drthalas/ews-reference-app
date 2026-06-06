# Task Map

This file is the compact execution map for future work.

## Stage Status

| Stage | Status | Scope |
| --- | --- | --- |
| 1. Initial scaffold | Done | React/Vite frontend, Spring Boot backend, health check, Docker Compose, initial docs. |
| 2. Architecture docs refinement | Done | Compact context, task map, API plans, policies, demo scenarios, and roadmap. |
| 3. Backend WorkItem API | Done | In-memory domain model, list/detail/update endpoints, validation, errors, and tests. |
| 4. Frontend RTK Query integration | Next | WorkItem models, feature API bindings, generated hooks, and basic list rendering. |

## Execution Order

1. Finish Stage 2 documentation and keep implementation untouched.
2. Add the backend WorkItem domain package and in-memory repository.
3. Add main WorkItem endpoints and OpenAPI-visible DTOs.
4. Add backend tests for list, detail, patch, validation, and errors.
5. Add frontend WorkItem RTK Query endpoints and typed models.
6. Add compact WorkItem list UI and server-confirmed edit flow.
7. Add polling with stale response protection.
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

## Future Implementation Guardrails

- Do not add persistence beyond in-memory storage.
- Do not add auth, external queues, external workers, WebSocket flows, or multi-user behavior.
- Keep endpoint contracts small and explicit.
- Add tests as each runtime behavior is introduced.
