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
  "updatedAt": "2026-06-06T00:00:00Z",
  "pendingOperation": null
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

Implemented. Submits an async command for a WorkItem and returns `202 Accepted` with an operation identifier.

Implemented request:

```json
{
  "type": "complete"
}
```

Implemented response:

```json
{
  "operationId": "op-1",
  "status": "pending",
  "workItemId": "wi-1"
}
```

Behavior:

- unknown WorkItem ids return `404` with `WORK_ITEM_NOT_FOUND`;
- invalid command payloads return `400` with `VALIDATION_ERROR`;
- accepted commands set WorkItem `pendingOperation` to the returned `operationId`;
- delayed completion clears `pendingOperation`, sets status to `done`, increments `revision`, and updates `updatedAt`.

### `GET /api/commands/{operationId}`

Implemented. Returns command status.

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

DEV endpoints live under `/api/dev` and are only for local scenario simulation.

### `POST /api/dev/work-items/{id}/external-change`

Implemented. Simulates a deterministic external WorkItem update for polling demos.

Behavior:

- unknown ids return `404` with `WORK_ITEM_NOT_FOUND`;
- if the current status is not `blocked`, status changes to `blocked`;
- if the current status is `blocked`, status changes to `in_progress`;
- tag `external-change` is added if it is not already present;
- `revision` increments by 1;
- `updatedAt` is refreshed;
- the updated WorkItem is returned.

### `POST /api/dev/fail-next-request`

Implemented. Arms a one-shot DEV failure for rollback demos.

Behavior:

- the endpoint returns `{ "failNextRequest": true }`;
- the next `PATCH /api/work-items/{id}` returns `500` with `DEV_FORCED_FAILURE`;
- the failure flag resets after one PATCH attempt;
- following PATCH requests behave normally;
- normal successful PATCH behavior still increments `revision` on actual change.

Planned later DEV endpoints:

- `GET /api/dev/settings`: returns active simulation settings.
- `PUT /api/dev/settings`: replaces simulation settings such as latency and automatic failure flags.
- `POST /api/dev/reset`: resets in-memory demo data and settings.
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

Implemented codes include `WORK_ITEM_NOT_FOUND`, `COMMAND_NOT_FOUND`, `VALIDATION_ERROR`, `DEV_FORCED_FAILURE`, and `INTERNAL_ERROR`.

Planned later codes include `WORK_ITEM_REVISION_CONFLICT`, `COMMAND_FAILED`, and `DEV_SIMULATION_ERROR`.
