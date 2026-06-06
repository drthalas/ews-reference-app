# Async Command Flow

Async command flow is planned for a later stage and is not implemented in the scaffold.

## Intended Flow

1. Frontend submits a command.
2. Backend returns a command identifier and pending status.
3. Frontend queries command status.
4. Backend returns completed or failed state.
5. Frontend reconciles affected WorkItem data.

## Boundaries

The first implementation should remain in-memory and single-process. No queue, Redis, external worker, or external database should be added.
