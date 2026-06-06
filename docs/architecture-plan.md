# Architecture Plan

EWS Reference App demonstrates frontend-backend interaction patterns in an EWS-like interface. The goal is architectural clarity, not business completeness.

## Stage Position

Stages 1 through 12 are complete. The project now has the scaffold, architecture documentation, the backend WorkItem API, frontend RTK Query integration, server-confirmed editing, polling, optimistic update/rollback, Railway deployment preparation, async command flow, DEV panel controls, conflict UI, stale response protection, detail prefetch, UX polish, and expanded backend/frontend tests.

Stage 13 will add final demo documentation.

## Monorepo Layout

The repository is split into three primary areas:

- `frontend/` contains the React application.
- `backend/` contains the Spring Boot application.
- `docs/` contains architecture notes, policies, scenarios, compact context, and roadmap material.

## Frontend and Backend Separation

The frontend owns presentation, client-side interaction state, generated RTK Query hooks, and user workflow composition. The backend owns HTTP contracts, domain rules, revisions, conflict decisions, future in-memory storage, and server-confirmed state.

The frontend communicates with the backend only through feature API modules built on `shared/api/baseApi.ts`. UI components must not depend on backend package names, Java DTOs, or storage details.

## Domain Boundary

`WorkItem` is the domain object. It represents a small unit of work with title, status, priority, optional assignee, tags, revision, timestamps, and optional pending operation state. Status values are `new`, `in_progress`, `blocked`, and `done`. Priority values are `low`, `medium`, `high`, and `critical`.

Backend revisions are the source of truth for freshness. Every server-confirmed WorkItem change increments the item revision. The frontend may display pending local intent, but it must reconcile against server-confirmed data.

## Frontend State Model

RTK Query is the default owner of server state: queries, mutations, cache invalidation, command status requests, and future request lifecycle handling.

Redux slices are reserved for UI state: selected rows, panel visibility, filters, edit drafts, temporary controls, and DEV panel settings. Server data should not be copied into UI slices except for explicit draft editing or scenario controls.

## Backend Model

Spring Boot provides REST endpoints, health checks, shared API error types, and OpenAPI documentation. The domain API lives under a backend `workitem` package, with separate controller, service, repository, DTO, and validation responsibilities.

Storage will remain in memory to keep the app reproducible and focused on reference flows. No database, external queue, external worker, or multi-process dependency is planned.

## API Boundary

Implemented main API endpoints live under `/api/work-items`. Command status endpoints live under `/api/commands`. DEV endpoints live under `/api/dev` and must stay separated from normal domain behavior.

The canonical error model for domain endpoints is `ApiError(status, code, message, details, timestamp)`.

## OpenAPI

springdoc-openapi exposes generated API documentation through Swagger UI at `/swagger-ui.html`. API contracts should remain small, explicit, and represented by request/response DTOs.

## Local Environment

Docker Compose starts the backend on port `8080` and the frontend on port `5173`. The frontend uses `VITE_API_BASE_URL` for backend calls.
