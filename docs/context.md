# Compact Project Context

Use this file as the short persistent context for future Codex tasks.

## Project

EWS Reference App is a local reference app for demonstrating frontend-backend interaction patterns. It is not a business product. The repository focuses on clear contracts, reproducible demo flows, and small implementation stages.

## Current Stage

- Stage 1 is done: initial scaffold.
- Stage 2 is done: architecture documentation and compact planning context.
- Stage 3 is done: minimal backend WorkItem API.
- Stage 4 is done: frontend RTK Query read-only integration.
- Stage 5 is done: server-confirmed WorkItem update.
- Stage 6 is done: polling and external data changes.
- Stage 6.5 is done: Railway demo-deploy preparation for separate frontend and backend services.
- Stage 7 is done: optimistic update and rollback.
- Stage 8 is done: async command flow.
- Stage 9 is done: DEV panel for edge cases.
- Stage 10 is done: conflict and stale response scenarios.
- Stage 11 is done: prefetch and UX polish.
- Stage 12 is next: expanded testing.

Stage 11 adds WorkItem detail prefetch on list hover/focus, polished loading/error/empty states, clearer state badges, compact UI event log, operation metadata, and DEV panel copy/layout improvements. No new backend mechanics were added.

## Repository Shape

- `backend/`: Java 21 Spring Boot service with `/api/health`, shared API types, Spring MVC, and springdoc-openapi.
- `frontend/`: React 18, TypeScript, Vite, MUI, Redux Toolkit, and RTK Query scaffold.
- `docs/`: architecture notes, policies, demo scenarios, and roadmap.
- `docker-compose.yml`: local frontend and backend services.
- `docs/deploy-railway.md`: Railway demo-deploy runbook for separate frontend and backend services.

## Existing Runtime

- Frontend URL: `http://localhost:5173`
- Backend health URL: `http://localhost:8080/api/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Frontend API base: `VITE_API_BASE_URL`, defaulting to `http://localhost:8080`
- Railway backend env: `ALLOWED_ORIGINS=https://<frontend-public-url>`

## Domain Contract

`WorkItem` is the backend domain object. Implemented fields:

- `id`: stable string identifier.
- `title`: short display name.
- `status`: one of `new`, `in_progress`, `blocked`, `done`.
- `priority`: one of `low`, `medium`, `high`, `critical`.
- `assignee`: optional display value.
- `tags`: ordered list of string labels.
- `revision`: monotonically increasing server revision.
- `updatedAt`: server timestamp.
- `pendingOperation`: optional operation id while an async command is pending.

Implemented main endpoints:

- `GET /api/work-items`
- `GET /api/work-items/{id}`
- `PATCH /api/work-items/{id}`
- `POST /api/work-items/{id}/commands`
- `GET /api/commands/{operationId}`

Implemented DEV endpoints:

- `GET /api/dev/settings`
- `PUT /api/dev/settings`
- `POST /api/dev/reset`
- `POST /api/dev/work-items/{id}/external-change`
- `POST /api/dev/fail-next-request`
- `POST /api/dev/fail-next-command`
- `POST /api/dev/trigger-stale-response`
- `POST /api/dev/trigger-conflict`

Implemented error model: `ApiError(status, code, message, details, timestamp)`.

## Design Rules

- RTK Query owns server state.
- Redux slices and local state own UI-only state.
- Backend owns domain rules, revisions, conflict decisions, and server-confirmed data.
- Storage remains in memory for deterministic local demos.
- DEV behavior is isolated under `/api/dev` and excluded from normal domain behavior.
- Every implementation stage should preserve buildability before moving on.
