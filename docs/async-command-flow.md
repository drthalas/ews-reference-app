# Async Command Flow

Async command flow is planned for a later stage and is not implemented in the scaffold.

## Intended Flow

1. Frontend submits a command.
2. Backend returns a command identifier and pending status.
3. Frontend queries command status.
4. Backend returns completed or failed state.
5. Frontend reconciles affected WorkItem data.

## Planned API

- `POST /api/work-items/{id}/commands`
- `GET /api/commands/{operationId}`

Command submission request:

```json
{
  "type": "complete",
  "expectedRevision": 3
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
- The frontend may show local pending UI while status is `pending`.
- Completed commands should trigger refresh or direct cache update for the affected WorkItem.
- Failed commands should expose a clear row-level or detail-level error.
- Conflicting commands should follow conflict handling rules.

## DEV Support

`POST /api/dev/fail-next-command` should force the next command to fail. This keeps failure behavior deterministic for demos.

## Boundaries

The first implementation should remain in-memory and single-process. No queue, Redis, external worker, or external database should be added.
