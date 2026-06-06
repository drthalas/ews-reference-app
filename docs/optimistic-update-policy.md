# Optimistic Update Policy

Optimistic update is planned for a later stage and is not implemented in the scaffold.

## Goals

- update the UI immediately for selected changes
- roll back on server rejection
- show pending state while the server result is unresolved
- keep reconciliation rules explicit
- avoid hiding server conflicts

## First Scope

Optimistic flows should be limited to narrow WorkItem fields first:

- `status`
- `priority`
- `assignee`

Title and description can stay server-confirmed until the simpler fields are proven.

## Request Contract

Optimistic mutations should send the current known `expectedRevision`. The backend decides whether the update is accepted. The frontend must not invent final revision values.

## Success Behavior

On success, replace the optimistic item with the server-confirmed WorkItem. The returned revision and timestamp become authoritative.

## Rollback Behavior

On validation or server failure, undo the RTK Query cache patch and show an error state tied to the affected WorkItem.

## Conflict Behavior

On revision conflict, undo the optimistic patch, show a conflict state, and request the current server item. The user should be able to review the server-confirmed state before retrying.

## Constraints

Each optimistic mutation must define success, rollback, and conflict behavior before implementation. Optimistic changes must not be used for async commands until command reconciliation is documented in the feature implementation.
