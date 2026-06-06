# Implementation Roadmap

## Stage Status

1. Initial scaffold - done.
2. Architecture docs refinement - done.
3. Backend WorkItem API - done.
4. Frontend RTK Query integration - done.
5. Server-confirmed update - done.
6. Polling - done.
6.5. Railway demo deploy - done.
7. Optimistic update - next.
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

Completed implementation stage:

- add WorkItem domain model with statuses `new`, `in_progress`, `blocked`, `done`
- add priorities `low`, `medium`, `high`, `critical`
- add in-memory repository and deterministic seed data
- add `GET /api/work-items`
- add `GET /api/work-items/{id}`
- add `PATCH /api/work-items/{id}`
- add `ApiError(status, code, message, details, timestamp)`
- add backend tests

### 4. Frontend RTK Query Integration

Completed implementation stage:

- added typed WorkItem models
- added `getWorkItems` and `getWorkItem` RTK Query endpoints
- added read-only WorkItem list and selected item details
- added loading, error, and empty states
- kept editing out of scope

### 5. Server-Confirmed Update

Completed implementation stage:

- added `updateWorkItem` mutation for `PATCH /api/work-items/{id}`
- added edit controls for title, status, priority, assignee, and tags
- added saving, success, and error feedback
- invalidated WorkItem list and detail cache after successful server response
- kept optimistic update out of scope

### 6. Polling

Completed implementation stage:

- added 3000 ms polling for WorkItem list data
- added visible polling on/off control and last refresh state
- added a minimal external-change demo action in the WorkItem details panel
- added `POST /api/dev/work-items/{id}/external-change`
- kept stale response protection and full DEV panel behavior out of scope

### 6.5. Railway Demo Deploy

Completed preparation stage:

- added Railway-compatible backend `PORT` and `ALLOWED_ORIGINS` configuration
- converted frontend Docker runtime to production static serving
- documented separate Railway `backend` and `frontend` services
- documented required env variables, CORS setup, smoke checks, redeploy notes, and troubleshooting
- left actual Railway project/service creation as manual work when Railway CLI is unavailable or not authorized

### 7. Optimistic Update

Next stage: add narrow optimistic updates with rollback and failed-change feedback.

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
