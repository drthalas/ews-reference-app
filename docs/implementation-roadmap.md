# Implementation Roadmap

## Stage Status

1. Initial scaffold - done.
2. Architecture docs refinement - current.
3. Backend WorkItem API - next.
4. Frontend RTK Query integration - planned.
5. Server-confirmed update - planned.
6. Polling - planned.
7. Optimistic update - planned.
8. Async command flow - planned.
9. DEV panel - planned.
10. Conflict and stale scenarios - planned.
11. Prefetch - planned.
12. Tests - planned.
13. Final demo documentation - planned.

## Stage Details

### 1. Initial Scaffold

Completed runtime foundation:

- React, TypeScript, Vite frontend.
- Redux Toolkit and RTK Query setup.
- MUI application shell.
- Spring Boot backend with health endpoint.
- OpenAPI and Swagger UI.
- Docker Compose local services.

### 2. Architecture Docs Refinement

Current documentation-only stage:

- compact context in `docs/context.md`
- execution map in `docs/tasks.md`
- refined architecture, API, backend, frontend, state, polling, optimistic, async, conflict, DEV, demo, and roadmap docs

No runtime behavior should be added in this stage.

### 3. Backend WorkItem API

Next implementation stage:

- add WorkItem domain model with statuses `new`, `in_progress`, `blocked`, `done`
- add priorities `low`, `medium`, `high`, `critical`
- add in-memory repository and deterministic seed data
- add `GET /api/work-items`
- add `GET /api/work-items/{id}`
- add `PATCH /api/work-items/{id}`
- add `ApiError(status, code, message, details, timestamp)`
- add backend tests

### 4. Frontend RTK Query Integration

Add typed WorkItem models, API endpoints, generated hooks, and basic list rendering.

### 5. Server-Confirmed Update

Add edit controls that wait for server confirmation before finalizing UI state.

### 6. Polling

Add periodic WorkItem refresh and stale response protection.

### 7. Optimistic Update

Add narrow optimistic updates with rollback, conflict handling, and server reconciliation.

### 8. Async Command Flow

Add command submission and status lookup through `POST /api/work-items/{id}/commands` and `GET /api/commands/{operationId}`.

### 9. DEV Panel

Add local-only controls and `/api/dev` endpoints for latency, failures, reset, external changes, stale responses, and conflicts.

### 10. Conflict And Stale Scenarios

Wire deterministic demos for revision conflict and stale polling protection.

### 11. Prefetch

Add detail prefetch behavior before navigation or panel open.

### 12. Tests

Broaden backend, frontend, and scenario coverage for implemented behavior.

### 13. Final Demo Documentation

Document the complete demo flow, expected outcomes, and local run instructions.
