# Backend Architecture

The backend is a Java 21 Spring Boot service named `ews-reference-backend`.

Stage 2 documents the future shape only. The current runtime still exposes the health endpoint and shared scaffold types.

## Package Layout

- `com.ewsreference.app` contains the application entry point.
- `health` contains the health endpoint.
- `common.api` contains shared API DTOs.
- Future `workitem` will contain the WorkItem domain API.
- Future `dev` will contain local-only simulation endpoints.

## Future WorkItem Module

Planned backend package split:

- `workitem.api`: controllers and request/response DTOs.
- `workitem.domain`: WorkItem model, status, priority, and command state.
- `workitem.service`: validation, revision checks, update rules, and command transitions.
- `workitem.storage`: in-memory repository and deterministic seed data.

`WorkItem` status values are `new`, `in_progress`, `blocked`, and `done`. Priority values are `low`, `medium`, `high`, and `critical`.

## Revision Strategy

Each WorkItem has a numeric `revision`. The backend increments it after every accepted server-side change. Mutating requests can include `expectedRevision`; when the expected value does not match the current value, the backend returns a conflict error instead of applying the update.

The backend is the authority for `revision` and `updatedAt`. Clients can send intent, but not final revision values.

## API Style

The backend exposes REST endpoints under `/api`. Endpoints should return explicit DTOs and predictable error shapes.

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

## Error Model

Future domain endpoints should return `ApiError(status, code, message, details, timestamp)`. The current scaffold record can be expanded when domain endpoints are added.

Expected HTTP mappings:

- `400`: invalid field, invalid command, or malformed simulation request.
- `404`: WorkItem or command not found.
- `409`: revision conflict.
- `500`: internal error or explicit DEV failure simulation.

## Storage

Future WorkItem data will be stored in memory. This keeps local demos deterministic and avoids database setup.

The in-memory repository should expose reset and external-change hooks for DEV scenarios, while normal domain services should use the same repository through explicit service methods.

## Documentation

springdoc-openapi generates OpenAPI documentation and serves Swagger UI at `/swagger-ui.html`.

## Exclusions

The scaffold intentionally excludes external databases, Redis, authorization, WebSocket flows, and multi-user behavior.
