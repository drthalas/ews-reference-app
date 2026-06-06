# Conflict Handling

Conflict handling UX is planned for Stage 10. Stage 9 adds backend DEV controls that can trigger conflict and stale response scenarios, but it does not implement full conflict resolution UI.

## Goals

- demonstrate server rejection when client state is outdated
- show clear user-facing conflict state
- refresh server state after conflict detection
- avoid implicit data loss

## Revision Contract

WorkItem records include `revision`. Mutating requests send `expectedRevision`. If `expectedRevision` does not match the current server revision, the backend returns `409` and does not apply the requested change.

Conflict error shape:

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

## Frontend Behavior

- Roll back any optimistic cache patch for the affected WorkItem.
- Display a conflict state near the affected row or detail form.
- Fetch the current server item.
- Let the user retry against the new revision after reviewing the server-confirmed state.

## DEV Support

Implemented DEV support:

- `POST /api/dev/work-items/{id}/external-change` mutates an item and increments revision to simulate another actor.
- `POST /api/dev/trigger-conflict` prepares a deterministic one-shot `409 DEV_CONFLICT` for the next WorkItem PATCH.
- `PUT /api/dev/settings` can enable `conflictMode`, where eligible PATCH requests return `409 DEV_CONFLICT`.

Stage 10 should turn these controls into a full conflict handling demo with clear frontend state and retry behavior.

## Constraints

The first conflict implementation should use in-memory state only. It should not introduce multi-user infrastructure.
