# DEV Panel

The DEV panel is implemented in Stage 9. It is a local demo/test tool for backend-controlled edge cases.

## Goals

- simulate latency
- simulate backend errors
- simulate command failures
- simulate conflicts
- simulate stale polling responses
- reset in-memory demo data

## API Boundary

DEV endpoints should be separated from domain endpoints, for example under `/api/dev`. DEV controls should be clearly excluded from normal domain behavior.

## Implemented Endpoints

- `GET /api/dev/settings`: read current DEV settings.
- `PUT /api/dev/settings`: replace current DEV settings.
- `POST /api/dev/reset`: reset demo data, command state, and DEV settings.
- `POST /api/dev/work-items/{id}/external-change`: apply a server-side WorkItem change outside normal UI flow.
- `POST /api/dev/fail-next-request`: force the next normal API request to fail.
- `POST /api/dev/fail-next-command`: force the next async command to fail.
- `POST /api/dev/trigger-stale-response`: make the next eligible WorkItem query return older data.
- `POST /api/dev/trigger-conflict`: prepare a revision mismatch for the next eligible update.

## Settings Shape

Implemented settings:

```json
{
  "responseDelayMs": 0,
  "failNextRequest": false,
  "failNextCommand": false,
  "staleResponseMode": false,
  "conflictMode": false,
  "lastResetAt": "2026-06-06T00:00:00Z",
  "lastDevAction": "initial seed"
}
```

## UI Scope

The DEV panel is implemented as a right-side MUI drawer. It exposes:

- backend response delay selection: `0`, `500`, `1500`, `3000`, or `5000` ms
- stale response mode toggle
- conflict mode toggle
- fail next request
- fail next command
- trigger stale response
- trigger conflict
- external change for the selected WorkItem
- reset backend state
- current settings summary

It is visually separated from normal WorkItem UI and is not required for normal use.

## Backend Rules

DEV actions may mutate in-memory state and simulation flags. They must not change the main API contract or require external infrastructure.

## Stage 10 Boundary

Stage 9 provides backend controls and basic normal-flow error display. Full conflict resolution UI, stale polling response protection, compare/merge behavior, and state logs remain part of Stage 10.
