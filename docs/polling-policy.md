# Polling Policy

Polling is implemented for the WorkItem list in Stage 6.

## Goals

- demonstrate periodic server refresh
- prepare for stale-response protection in later stages
- expose pending and refresh states clearly
- keep polling configuration visible in the feature layer
- support DEV scenarios for stale response simulation

## Scope

Polling should be tied to WorkItem query endpoints. It should not be global application behavior.

The first polling implementation targets `GET /api/work-items` with a 3000 ms interval. Selected details are derived from the polled list data when available, with the detail query remaining as a fallback for the selected id.

## Revision Rules

Each WorkItem response includes `revision`. Stage 10 keeps the freshest accepted revision per item. A polling response with an older item revision does not replace the current cached item.

## UI Rules

The UI should distinguish:

- initial load
- background refresh
- manual refresh
- refresh error

Polling should not hide an active optimistic update, pending command, or conflict message.

Stage 7 pauses polling while an optimistic WorkItem save is pending. This is a narrow protection against ordinary polling visually overwriting optimistic cache patches before the backend response. Stage 10 adds explicit stale response detection and ignored stale response feedback.

Stage 8 uses WorkItem polling to bring in final async command state after delayed backend completion. Command status is also polled separately through `GET /api/commands/{operationId}` while an operation is pending.

## DEV Support

Implemented in Stage 6:

- `POST /api/dev/work-items/{id}/external-change`: toggles status between `blocked` and `in_progress` according to current state, adds the `external-change` tag, increments revision, and updates `updatedAt`.

Implemented in Stage 7:

- `POST /api/dev/fail-next-request`: makes the next WorkItem PATCH return `DEV_FORCED_FAILURE` once, then resets.

Implemented in Stage 9:

- `GET /api/dev/settings` and `PUT /api/dev/settings`: expose response delay and stale-response mode controls.
- `POST /api/dev/trigger-stale-response`: prepares a stale response for the next eligible WorkItem query.

The Stage 9 frontend exposes these controls in the DEV panel. The Stage 10 frontend shows that stale data was ignored without degrading normal state.
