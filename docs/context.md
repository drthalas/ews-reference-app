# Compact Project Context

Use this file as the short persistent context for future Codex tasks.

## Project

EWS Reference App is a local reference app for demonstrating frontend-backend interaction patterns. It is not a business product. The repository focuses on clear contracts, reproducible demo flows, and small implementation stages.

## Current Stage

- Stage 1 is done: initial scaffold.
- Stage 2 is current: architecture documentation and compact planning context.
- Stage 3 is next: minimal backend WorkItem API.

Stage 2 is documentation and planning only. Do not implement WorkItem endpoints, polling, optimistic updates, async commands, conflict flows, or DEV controls in this stage.

## Repository Shape

- `backend/`: Java 21 Spring Boot service with `/api/health`, shared API types, Spring MVC, and springdoc-openapi.
- `frontend/`: React 18, TypeScript, Vite, MUI, Redux Toolkit, and RTK Query scaffold.
- `docs/`: architecture notes, policies, demo scenarios, and roadmap.
- `docker-compose.yml`: local frontend and backend services.

## Existing Runtime

- Frontend URL: `http://localhost:5173`
- Backend health URL: `http://localhost:8080/api/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Frontend API base: `VITE_API_BASE_URL`, defaulting to `http://localhost:8080`

## Domain Contract To Build Later

`WorkItem` is the future domain object. Planned fields:

- `id`: stable string identifier.
- `title`: short display name.
- `description`: optional detail text.
- `status`: one of `new`, `in_progress`, `blocked`, `done`.
- `priority`: one of `low`, `medium`, `high`, `critical`.
- `assignee`: optional display value.
- `revision`: monotonically increasing server revision.
- `updatedAt`: server timestamp.

Planned main endpoints:

- `GET /api/work-items`
- `GET /api/work-items/{id}`
- `PATCH /api/work-items/{id}`
- `POST /api/work-items/{id}/commands`
- `GET /api/commands/{operationId}`

Planned DEV endpoints:

- `GET /api/dev/settings`
- `PUT /api/dev/settings`
- `POST /api/dev/reset`
- `POST /api/dev/work-items/{id}/external-change`
- `POST /api/dev/fail-next-request`
- `POST /api/dev/fail-next-command`
- `POST /api/dev/trigger-stale-response`
- `POST /api/dev/trigger-conflict`

Planned error model: `ApiError(status, code, message, details, timestamp)`.

## Design Rules

- RTK Query owns server state.
- Redux slices and local state own UI-only state.
- Backend owns domain rules, revisions, conflict decisions, and server-confirmed data.
- Storage remains in memory for deterministic local demos.
- DEV behavior is isolated under `/api/dev` and excluded from normal domain behavior.
- Every implementation stage should preserve buildability before moving on.
