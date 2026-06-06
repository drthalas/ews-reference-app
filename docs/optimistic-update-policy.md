# Optimistic Update Policy

Optimistic update is planned for a later stage and is not implemented in the scaffold.

## Goals

- update the UI immediately for selected changes
- roll back on server rejection
- show pending state while the server result is unresolved
- keep reconciliation rules explicit

## Future Constraints

Optimistic flows should be limited to narrow WorkItem fields first. Each optimistic mutation must define success, rollback, and conflict behavior.
