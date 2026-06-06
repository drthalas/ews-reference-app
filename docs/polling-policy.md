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

Each WorkItem response includes `revision`. Stage 6 displays revisions and server update timestamps. Explicit stale-response protection is deferred until the conflict/stale stage.

Future stale-response handling should keep the highest accepted revision per item. A polling response with an older item revision must not replace the current cached item.

## UI Rules

The UI should distinguish:

- initial load
- background refresh
- manual refresh
- refresh error

Polling should not hide an active optimistic update, pending command, or conflict message.

## DEV Support

Implemented in Stage 6:

- `POST /api/dev/work-items/{id}/external-change`: toggles status between `blocked` and `in_progress` according to current state, adds the `external-change` tag, increments revision, and updates `updatedAt`.

Planned later:

- `POST /api/dev/trigger-stale-response`: prepares a stale response for the next eligible WorkItem query. The UI should show that stale data was ignored without degrading normal state.
