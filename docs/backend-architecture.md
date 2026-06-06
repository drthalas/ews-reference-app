# Backend Architecture

The backend is a Java 21 Spring Boot service named `ews-reference-backend`.

Stage 3 implements the first backend WorkItem runtime API alongside the health endpoint and shared API error types.

## Package Layout

- `com.ewsreference.app` contains the application entry point.
- `health` contains the health endpoint.
- `common.api` contains shared API DTOs.
- `workitem` contains the WorkItem domain API.
- Future `dev` will contain local-only simulation endpoints.

## WorkItem Module

Backend package split:

- `workitem.api`: controllers and request/response DTOs.
- `workitem.domain`: WorkItem model, status, and priority.
- `workitem.service`: validation, revision updates, timestamp handling, and update rules.
- `workitem.storage`: in-memory repository and deterministic seed data.

`WorkItem` status values are `new`, `in_progress`, `blocked`, and `done`. Priority values are `low`, `medium`, `high`, and `critical`.

## Revision Strategy

Each WorkItem has a numeric `revision`. The backend increments it after every accepted server-side data change. Empty or no-op PATCH payloads return the current WorkItem without incrementing revision.

The backend is the authority for `revision` and `updatedAt`. Clients can send intent, but not final revision values.

## API Style

The backend exposes REST endpoints under `/api`. Endpoints should return explicit DTOs and predictable error shapes.

Implemented main endpoints:

- `GET /api/work-items`
- `GET /api/work-items/{id}`
- `PATCH /api/work-items/{id}`

Planned later endpoints:

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

Domain endpoints return `ApiError(status, code, message, details, timestamp)`.

Expected HTTP mappings:

- `400`: invalid WorkItem PATCH field.
- `404`: WorkItem not found.
- `500`: internal error or explicit DEV failure simulation.

## Storage

WorkItem data is stored in memory. This keeps local demos deterministic and avoids database setup.

The in-memory repository should expose reset and external-change hooks for DEV scenarios, while normal domain services should use the same repository through explicit service methods.

## Documentation

springdoc-openapi generates OpenAPI documentation and serves Swagger UI at `/swagger-ui.html`.

## Exclusions

The scaffold intentionally excludes external databases, Redis, authorization, WebSocket flows, and multi-user behavior.
