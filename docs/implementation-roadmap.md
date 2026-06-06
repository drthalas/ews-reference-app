# Implementation Roadmap

## Stage Status

1. Initial scaffold - done.
2. Architecture docs refinement - done.
3. Backend WorkItem API - done.
4. Frontend RTK Query integration - done.
5. Server-confirmed update - done.
6. Polling - done.
6.5. Railway demo deploy - done.
7. Optimistic update - done.
8. Async command flow - done.
9. DEV panel - done.
10. Conflict and stale scenarios - done.
11. Prefetch - done.
12. Tests - done.
13. Final demo documentation - done.

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

Completed implementation stage:

- added optimistic WorkItem save through RTK Query cache patching
- patched WorkItem list and selected detail caches before backend confirmation
- added rollback by undoing RTK Query cache patches on backend error
- added a minimal one-shot `POST /api/dev/fail-next-request` endpoint for rollback demos
- added optimistic pending feedback and rollback error feedback
- kept the classic server-confirmed update path working separately

### 8. Async Command Flow

Completed implementation stage:

- added command submission through `POST /api/work-items/{id}/commands`
- returned `202 Accepted` with `operationId`
- added command status lookup through `GET /api/commands/{operationId}`
- added WorkItem `pendingOperation`
- added delayed in-memory completion for the `complete` command
- added frontend pending badge and command status polling
- used WorkItem polling to receive the final completed state

### 9. DEV Panel

Completed implementation stage:

- added local-only DEV settings for response delay, stale response mode, and conflict mode
- added `/api/dev/settings`, `/api/dev/reset`, `/api/dev/fail-next-command`, `/api/dev/trigger-stale-response`, and `/api/dev/trigger-conflict`
- kept existing external-change and fail-next-request endpoints under the DEV boundary
- added one-shot async command failure where the command is accepted and later completes as failed
- added one-shot conflict where the next PATCH returns `409 DEV_CONFLICT`
- added one-shot stale response where the next WorkItem list/detail response returns an older revision
- added frontend `features/devPanel` with a right-side MUI drawer for all DEV controls
- kept full conflict resolution UI and stale response protection out of scope

### 10. Conflict And Stale Scenarios

Completed implementation stage:

- enriched `DEV_CONFLICT` responses with server WorkItem details
- added conflict UI for classic and optimistic WorkItem saves
- added reload-from-backend and cancel-editing actions for conflicts
- added revision-aware WorkItem list/detail cache merge policy
- ignored incoming stale responses whose revision is lower than the freshest known cached revision
- showed stale ignored state in the WorkItem screen
- kept merge editor, force overwrite, and real-time collaboration out of scope

### 11. Prefetch

Completed implementation stage:

- added `getWorkItem` prefetch on WorkItem row hover/focus
- kept prefetch bounded with RTK Query `ifOlderThan`
- improved loading, empty, error, save, command, stale, and conflict states
- added compact UI event log and clear local log action
- improved revision, updatedAt, pending operation, command status, polling, and stale state display
- polished DEV panel copy, feedback, disabled states, and settings summary
- kept new backend mechanics and expanded test suites out of scope

### 12. Tests

Completed testing stage:

- added deterministic reset-before-each behavior to mutable backend controller tests
- expanded WorkItem validation coverage for invalid status and priority values
- expanded async command coverage for the "already pending operation" validation path
- added frontend Vitest, React Testing Library, jsdom, user-event, jest-dom, and MSW setup
- added WorkItem UI tests for loading, list/detail rendering, prefetch, error, empty, edit cancel, classic save, optimistic rollback, conflict state, and stale event log behavior
- added DEV panel UI coverage for drawer opening and disabled selected-item actions
- documented frontend test commands
- kept Playwright/e2e, new product features, and new backend scenarios out of scope

### 13. Final Demo Documentation

Completed documentation stage:

- finalized README with local run, Docker Compose, Railway deploy summary, API examples, runbook pointer, and known limitations
- added `docs/runbook.md` as the primary demo script and operator guide
- finalized `docs/demo-scenarios.md` with expected API calls, UI behavior, recovery steps, and reset steps
- documented classic update, polling, optimistic rollback, async command, DEV panel, conflict, and stale response scenarios
- kept runtime implementation unchanged
