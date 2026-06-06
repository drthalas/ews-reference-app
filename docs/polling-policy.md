# Polling Policy

Polling is planned for a later stage and is not implemented in the scaffold.

## Goals

- demonstrate periodic server refresh
- avoid replacing newer client state with stale responses
- expose pending and refresh states clearly
- keep polling configuration visible in the feature layer
- support DEV scenarios for stale response simulation

## Scope

Polling should be tied to WorkItem query endpoints. It should not be global application behavior.

The first polling implementation should target `GET /api/work-items` only. Detail polling can be added later if a scenario requires it.

## Revision Rules

Each WorkItem response includes `revision`. For every item, the frontend should keep the highest revision it has accepted. A polling response with an older item revision must not replace the current cached item.

List-level replacement is allowed only after item-level freshness checks. New items can be inserted. Missing items should not be removed unless the backend contract explicitly introduces deletion semantics.

## UI Rules

The UI should distinguish:

- initial load
- background refresh
- manual refresh
- stale response ignored
- refresh error

Polling should not hide an active optimistic update, pending command, or conflict message.

## DEV Support

`POST /api/dev/trigger-stale-response` should prepare a stale response for the next eligible WorkItem query. The UI should show that stale data was ignored without degrading normal state.
