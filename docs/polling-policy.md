# Polling Policy

Polling is planned for a later stage and is not implemented in the scaffold.

## Goals

- demonstrate periodic server refresh
- avoid replacing newer client state with stale responses
- expose pending and refresh states clearly
- keep polling configuration visible in the feature layer

## Future Constraints

Polling should be tied to WorkItem query endpoints and should include stale response handling rules before it is enabled in the UI.
