# DEV Panel Plan

The DEV panel is planned for a later stage and is not implemented in the scaffold.

## Goals

- simulate latency
- simulate backend errors
- simulate command failures
- simulate conflicts
- simulate stale polling responses
- reset in-memory demo data

## API Boundary

DEV endpoints should be separated from domain endpoints, for example under `/api/dev`. DEV controls should be clearly excluded from normal domain behavior.

## Planned Endpoints

- `GET /api/dev/settings`: read current DEV settings.
- `PUT /api/dev/settings`: replace current DEV settings.
- `POST /api/dev/reset`: reset demo data, command state, and DEV settings.
- `POST /api/dev/work-items/{id}/external-change`: apply a server-side WorkItem change outside normal UI flow.
- `POST /api/dev/fail-next-request`: force the next normal API request to fail.
- `POST /api/dev/fail-next-command`: force the next async command to fail.
- `POST /api/dev/trigger-stale-response`: make the next eligible WorkItem query return older data.
- `POST /api/dev/trigger-conflict`: prepare a revision mismatch for the next eligible update.

## Settings Shape

Planned settings:

```json
{
  "latencyMs": 0,
  "failNextRequest": false,
  "failNextCommand": false,
  "staleResponseArmed": false,
  "conflictArmed": false
}
```

## UI Scope

The DEV panel should expose compact controls for latency, failure toggles, reset, external change, stale response, and conflict. It should not be presented as production functionality.

## Backend Rules

DEV actions may mutate in-memory state and simulation flags. They must not change the main API contract or require external infrastructure.
