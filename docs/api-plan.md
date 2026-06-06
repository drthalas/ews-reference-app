# API Plan

The current implemented API surface contains only `GET /api/health`.

```json
{
  "status": "ok",
  "service": "ews-reference-backend"
}
```

All endpoints below are planned contracts for later stages. They are not implemented in Stage 2.

## WorkItem Contract

Planned response shape:

```json
{
  "id": "wi-1",
  "title": "Review intake",
  "description": "Confirm required details before processing.",
  "status": "new",
  "priority": "medium",
  "assignee": "Alex",
  "revision": 1,
  "updatedAt": "2026-06-06T00:00:00Z"
}
```

Status values:

- `new`
- `in_progress`
- `blocked`
- `done`

Priority values:

- `low`
- `medium`
- `high`
- `critical`

## Main Endpoints

### `GET /api/work-items`

Returns the current in-memory list of WorkItem records. The first version should support deterministic demo data and no pagination.

### `GET /api/work-items/{id}`

Returns a single WorkItem. This supports detail refresh and future prefetch scenarios.

### `PATCH /api/work-items/{id}`

Applies a server-confirmed partial update. Planned request fields:

```json
{
  "title": "Review intake",
  "description": "Updated detail",
  "status": "in_progress",
  "priority": "high",
  "assignee": "Alex",
  "expectedRevision": 1
}
```

The backend validates enum values, requires a matching `expectedRevision` when conflict handling is enabled, increments `revision`, updates `updatedAt`, and returns the server-confirmed WorkItem.

### `POST /api/work-items/{id}/commands`

Submits an async command for a WorkItem and returns an operation identifier.

Planned request:

```json
{
  "type": "complete",
  "expectedRevision": 3
}
```

Planned response:

```json
{
  "operationId": "op-1",
  "status": "pending",
  "workItemId": "wi-1"
}
```

### `GET /api/commands/{operationId}`

Returns command status.

```json
{
  "operationId": "op-1",
  "status": "completed",
  "workItemId": "wi-1",
  "resultRevision": 4,
  "error": null
}
```

Command status values should start with `pending`, `completed`, and `failed`.

## DEV Endpoints

DEV endpoints are planned under `/api/dev` and are only for local scenario simulation.

- `GET /api/dev/settings`: returns active simulation settings.
- `PUT /api/dev/settings`: replaces simulation settings such as latency and automatic failure flags.
- `POST /api/dev/reset`: resets in-memory demo data and settings.
- `POST /api/dev/work-items/{id}/external-change`: mutates server state to simulate another actor.
- `POST /api/dev/fail-next-request`: makes the next normal request fail.
- `POST /api/dev/fail-next-command`: makes the next async command fail.
- `POST /api/dev/trigger-stale-response`: returns an older revision on the next eligible request.
- `POST /api/dev/trigger-conflict`: prepares a revision mismatch for conflict demonstration.

## Error Model

Future domain and DEV endpoints should return the canonical error shape:

```json
{
  "status": 409,
  "code": "WORK_ITEM_REVISION_CONFLICT",
  "message": "The WorkItem has changed on the server.",
  "details": {
    "workItemId": "wi-1",
    "expectedRevision": 3,
    "actualRevision": 4
  },
  "timestamp": "2026-06-06T00:00:00Z"
}
```

Planned codes include `WORK_ITEM_NOT_FOUND`, `WORK_ITEM_INVALID_STATUS`, `WORK_ITEM_INVALID_PRIORITY`, `WORK_ITEM_REVISION_CONFLICT`, `COMMAND_NOT_FOUND`, `COMMAND_FAILED`, and `DEV_SIMULATION_ERROR`.
