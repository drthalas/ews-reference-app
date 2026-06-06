# Architecture Plan

EWS Reference App demonstrates frontend-backend interaction patterns in an EWS-like interface. The goal is architectural clarity, not business completeness.

## Monorepo Layout

The repository is split into three primary areas:

- `frontend/` contains the React application.
- `backend/` contains the Spring Boot application.
- `docs/` contains architecture notes, policies, scenarios, and roadmap material.

## Frontend and Backend Separation

The frontend owns presentation, client-side state, and interaction state. The backend owns HTTP contracts, domain rules, future in-memory storage, and server-confirmed state.

The frontend communicates with the backend only through API modules. Direct coupling to backend internals is avoided.

## Frontend State Model

RTK Query is the default tool for server state: queries, mutations, cache invalidation, and future request lifecycle handling.

Redux slices are reserved for UI state: selected rows, panel visibility, filters, temporary controls, and DEV panel settings.

## Backend Model

Spring Boot provides REST endpoints, health checks, and OpenAPI documentation. The future domain object is `WorkItem`, implemented under a backend `workitem` package when the API stage begins.

Storage will remain in-memory to keep the app reproducible and focused on reference flows.

## OpenAPI

springdoc-openapi exposes generated API documentation through Swagger UI at `/swagger-ui.html`. API contracts should remain small and explicit.

## DEV API

Future DEV endpoints should be separated from domain endpoints. DEV endpoints may simulate latency, errors, conflicts, and stale responses for demonstration scenarios.

## Local Environment

Docker Compose starts the backend on port `8080` and the frontend on port `5173`. The frontend uses `VITE_API_BASE_URL` for backend calls.
