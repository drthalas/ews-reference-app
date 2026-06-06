# Optimistic Update Policy

Optimistic update is implemented for WorkItem PATCH in Stage 7.

## Goals

- update the UI immediately for selected changes
- roll back on server rejection
- show pending state while the server result is unresolved
- keep reconciliation rules explicit
- avoid hiding server conflicts

## First Scope

The Stage 7 optimistic flow uses the same edit form as the server-confirmed update path and supports:

- `title`
- `status`
- `priority`
- `assignee`
- `tags`

The classic server-confirmed save path remains available separately and does not patch cache before the backend response.

## Request Contract

The current PATCH contract does not send `expectedRevision`; conflict handling is deferred to the conflict stage. The frontend must not invent final revision values. The optimistic patch changes editable display fields only and keeps the current `revision` and `updatedAt` until the backend confirms.

## Success Behavior

On success, replace the optimistic item with the server-confirmed WorkItem. The returned revision and timestamp become authoritative.

## Rollback Behavior

On validation or server failure, undo the RTK Query cache patches for both `getWorkItems` and `getWorkItem`, reset the edit draft to the server-confirmed item from before the optimistic save, and show an error state tied to the affected WorkItem.

Stage 7 includes a minimal DEV endpoint for rollback demos:

- `POST /api/dev/fail-next-request`: arms a one-shot failure for the next WorkItem PATCH.

The forced failure returns `500` with `DEV_FORCED_FAILURE` and then resets, so the next PATCH behaves normally.

## Conflict Behavior

Conflict handling is implemented in Stage 10. When an optimistic save receives `409 DEV_CONFLICT`, the optimistic cache patch is undone, a dedicated conflict state is shown, and the user can either reload from backend or cancel editing. The frontend does not force overwrite or open a merge editor.

## Polling Interaction

Stage 7 pauses WorkItem polling while an optimistic save is pending. This avoids the obvious UX bug where ordinary polling immediately overwrites the optimistic cache patch before the backend response. Stage 10 adds revision-aware stale response protection for list and detail cache merges.

## Constraints

Each optimistic mutation must define success, rollback, and conflict behavior before implementation. Optimistic changes must not be used for async commands until command reconciliation is documented in the feature implementation.
