# Async Command Flow

Async command flow is implemented for WorkItem `complete` commands in Stage 8.

## Intended Flow

1. Frontend submits a command.
2. Backend returns a command identifier and pending status.
3. Frontend queries command status.
4. Backend returns completed or failed state.
5. Frontend reconciles affected WorkItem data.

## Implemented API

- `POST /api/work-items/{id}/commands`
- `GET /api/commands/{operationId}`

Command submission request:

```json
{
  "type": "complete"
}
```

Initial response:

```json
{
  "operationId": "op-1",
  "status": "pending",
  "workItemId": "wi-1"
}
```

The submit endpoint returns `202 Accepted`.

Status response:

```json
{
  "operationId": "op-1",
  "status": "completed",
  "workItemId": "wi-1",
  "resultRevision": 4,
  "error": null
}
```

## State Rules

- The backend owns command status.
- The frontend shows pending UI while status is `pending`.
- The WorkItem response includes `pendingOperation` while a command is active.
- Completed commands clear `pendingOperation`, set WorkItem status to `done`, increment revision, and refresh `updatedAt`.
- WorkItem polling brings the final WorkItem state into the UI.
- Failed commands should expose a clear row-level or detail-level error.
- Conflicting commands should follow conflict handling rules.

## DEV Support

`POST /api/dev/fail-next-command` is still planned for a later DEV panel stage. Stage 8 implements the successful delayed command flow only.

## Boundaries

The first implementation should remain in-memory and single-process. No queue, Redis, external worker, or external database should be added.
