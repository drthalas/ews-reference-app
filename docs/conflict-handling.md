# Conflict Handling

Conflict handling UX is implemented in Stage 10. Stage 9 added backend DEV controls that trigger conflict and stale response scenarios; Stage 10 wires those controls to user-facing state.

## Goals

- demonstrate server rejection when client state is outdated
- show clear user-facing conflict state
- refresh server state after conflict detection
- avoid implicit data loss

## Revision Contract

WorkItem records include `revision`. The current reference implementation uses DEV controls to create deterministic one-shot conflicts. A triggered conflict returns `409` and does not apply the requested change.

Conflict error shape:

```json
{
  "status": 409,
  "code": "WORK_ITEM_REVISION_CONFLICT",
  "message": "The WorkItem has changed on the server.",
  "details": {
      "workItemId": "wi-1",
      "clientRevision": 3,
      "serverRevision": 4,
      "serverWorkItem": {
        "id": "wi-1",
        "title": "Review intake",
        "status": "blocked",
        "priority": "medium",
        "assignee": "Alex",
        "tags": ["intake", "backend"],
        "revision": 4,
        "updatedAt": "2026-06-06T00:00:00Z",
        "pendingOperation": null
      }
  },
  "timestamp": "2026-06-06T00:00:00Z"
}
```

## Frontend Behavior

- Roll back any optimistic cache patch for the affected WorkItem.
- Display a conflict state near the detail form.
- Show error code, message, client revision, server revision, and WorkItem id when available.
- Offer `Обновить с backend` to refetch list/detail data and exit edit mode.
- Offer `Отменить редактирование` to reset the draft to the latest visible server state and exit edit mode.
- Avoid merge editor, compare editor, and force overwrite behavior in this stage.

## DEV Support

Implemented DEV support:

- `POST /api/dev/work-items/{id}/external-change` mutates an item and increments revision to simulate another actor.
- `POST /api/dev/trigger-conflict` prepares a deterministic one-shot `409 DEV_CONFLICT` for the next WorkItem PATCH.
- `PUT /api/dev/settings` can enable `conflictMode`, where eligible PATCH requests return `409 DEV_CONFLICT`.

Stage 10 turns these controls into a conflict handling demo with clear frontend state and reload/cancel behavior.

## Constraints

The first conflict implementation should use in-memory state only. It should not introduce multi-user infrastructure.
