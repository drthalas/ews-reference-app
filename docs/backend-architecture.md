# Backend Architecture

The backend is a Java 21 Spring Boot service named `ews-reference-backend`.

Stage 12 includes the WorkItem runtime API, shared API error types, local-only DEV controls, conflict details, stale response simulation, an in-memory async command flow, and expanded MockMvc coverage for those implemented flows.

## Package Layout

- `com.ewsreference.app` contains the application entry point.
- `health` contains the health endpoint.
- `common.api` contains shared API DTOs.
- `workitem` contains the WorkItem domain API.
- `command` contains async command APIs, operation state, and delayed completion logic.
- `devtools` contains local-only simulation endpoints.

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

## Error Model

Domain endpoints return `ApiError(status, code, message, details, timestamp)`.

Expected HTTP mappings:

- `400`: invalid WorkItem PATCH field.
- `404`: WorkItem not found.
- `500`: internal error or explicit DEV failure simulation.

`POST /api/dev/fail-next-request` arms one controlled `DEV_FORCED_FAILURE` response for the next WorkItem PATCH and then resets.

`POST /api/dev/trigger-conflict` arms one controlled `409 DEV_CONFLICT` response for the next WorkItem PATCH and then resets. The response includes `workItemId`, `clientRevision`, `serverRevision`, and `serverWorkItem` details for conflict UI work.

`POST /api/dev/fail-next-command` lets the next accepted async command complete as `failed`; the WorkItem `pendingOperation` is cleared and the WorkItem status is not changed to `done`.

`POST /api/dev/trigger-stale-response` makes the next eligible WorkItem list/detail read return a controlled older revision. The frontend ignores stale WorkItem responses by comparing revisions.

`GET /api/commands/{operationId}` returns `404 COMMAND_NOT_FOUND` for unknown operation ids.

## Storage

WorkItem data is stored in memory. This keeps local demos deterministic and avoids database setup.

The in-memory repository is accessed through explicit service methods. The external-change helper and async command completion reuse `WorkItemService` so revision and timestamp handling stays consistent with normal server-side updates.

Command operations are also stored in memory. The async command implementation uses a single-process scheduled executor for delayed completion; there is no external queue, broker, Redis, or worker.

`POST /api/dev/reset` clears command operations, restores deterministic WorkItem seed data, clears pending operations, and resets DEV settings.

## Documentation

springdoc-openapi generates OpenAPI documentation and serves Swagger UI at `/swagger-ui.html`.

## Testing

Backend tests use Spring Boot Test and MockMvc. Mutable controller tests reset in-memory WorkItem, command, and DEV state before each test so scenarios remain deterministic. Coverage includes WorkItem list/detail/PATCH validation, DEV settings/actions, async commands, conflict responses, stale responses, and reset behavior.

## Exclusions

The scaffold intentionally excludes external databases, Redis, authorization, WebSocket flows, and multi-user behavior.
