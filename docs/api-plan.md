# API Plan

The implemented API surface contains `GET /api/health` and the first backend WorkItem API.

```json
{
  "status": "ok",
  "service": "ews-reference-backend"
}
```

## WorkItem Contract

Implemented response shape:

```json
{
  "id": "wi-1",
  "title": "Review intake",
  "status": "new",
  "priority": "medium",
  "assignee": "Alex",
  "tags": ["intake", "backend"],
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

Implemented. Returns the current deterministic in-memory list of WorkItem records. The first version has no pagination.

### `GET /api/work-items/{id}`

Implemented. Returns a single WorkItem. Unknown ids return `404` with `WORK_ITEM_NOT_FOUND`.

### `PATCH /api/work-items/{id}`

Implemented. Applies a server-confirmed partial update. Request fields:

```json
{
  "title": "Review intake",
  "status": "in_progress",
  "priority": "high",
  "assignee": "Alex",
  "tags": ["backend", "validation"]
}
```

Allowed fields are `title`, `status`, `priority`, `assignee`, and `tags`.

The backend validates enum values, requires non-empty title when `title` is provided, rejects non-array or null-containing `tags`, increments `revision` only when data actually changes, updates `updatedAt` only when data actually changes, and returns the server-confirmed WorkItem.

Empty or no-op PATCH payloads return the current WorkItem without incrementing `revision` and without changing `updatedAt`.

### `POST /api/work-items/{id}/commands`

Planned for a later stage. Submits an async command for a WorkItem and returns an operation identifier.

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

Planned for a later stage. Returns command status.

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

Domain endpoints return the canonical error shape:

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

Implemented codes include `WORK_ITEM_NOT_FOUND`, `VALIDATION_ERROR`, and `INTERNAL_ERROR`.

Planned later codes include `WORK_ITEM_REVISION_CONFLICT`, `COMMAND_NOT_FOUND`, `COMMAND_FAILED`, and `DEV_SIMULATION_ERROR`.
