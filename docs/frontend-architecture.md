# Frontend Architecture

The frontend is a Vite React application written in TypeScript.

Stage 9 adds a separate DEV panel feature through RTK Query while keeping the normal WorkItem flows visible.

## Layers

- `app/` contains the root component, store, and providers.
- `shared/api/` contains the base RTK Query API setup.
- `features/` contains feature modules with local API bindings and UI.

## Server State

RTK Query owns server state. Feature APIs inject endpoints into the shared base API.

WorkItem server state belongs in `features/workItems/api`. Current typed endpoints cover:

- list retrieval
- detail retrieval
- server-confirmed patch updates
- optimistic patch updates
- async command submission
- command status polling
- polling options for active WorkItem queries

DEV controls belong in `features/devPanel/api`. Current typed endpoints cover:

- `getDevSettings`
- `updateDevSettings`
- `resetDevState`
- `triggerExternalChange`
- `failNextRequest`
- `failNextCommand`
- `triggerStaleResponse`
- `triggerConflict`

Later stages will add full conflict/stale handling.

## UI State

Redux slices may be added later for UI-only state. Server data should not be duplicated in UI slices unless a feature has a clear temporary editing need.

Examples of UI-only state:

- selected WorkItem id
- active filter values
- edit drawer state
- draft form values
- pending command indicators that are not returned by the backend yet
- DEV panel visibility and local control state

## Planned WorkItem Feature

The WorkItem feature is compact and operational:

- list rows display title, status, priority, assignee, revision, and update state
- selected item details show status, priority, assignee, revision, updatedAt, and tags
- loading, error, and empty states are visible
- edit mode supports title, status, priority, assignee, and tags
- save waits for backend confirmation before leaving edit mode
- polling can be toggled on or off with a 3000 ms interval
- selected details prefer the polled list item when present, so external changes become visible without manual refresh
- edit mode has separate server-confirmed and optimistic save actions
- optimistic save patches WorkItem list and detail caches immediately
- optimistic save shows pending state while backend confirmation is unresolved
- backend errors undo optimistic cache patches and show rollback feedback
- async command button submits a `complete` command and receives an operation id
- command status is polled independently while the operation is pending
- WorkItem `pendingOperation` is shown in list rows and details
- WorkItem polling brings in the final completed state
- a separate right-side DEV panel exposes backend-controlled edge-case actions

Later stages will add prefetch behavior, conflict UI, and stale response protection.

## Stale Response Protection

Stage 7 pauses polling while an optimistic save is pending. Full stale response protection is planned for the conflict/stale stage, where the frontend must compare incoming revisions with the newest revision already known for each item.

## Styling

MUI provides layout, typography, controls, and theme configuration. Components should stay compact and oriented toward repeated operational use.

## Module Boundary

The `workItems` frontend feature contains WorkItem API bindings, command API bindings, list UI, detail UI, classic edit controls, optimistic edit controls, polling controls, and async command controls. The `devPanel` feature contains DEV API bindings, settings controls, one-shot edge-case actions, and backend reset controls. Shared API transport stays in `shared/api/baseApi.ts`; domain-specific DTOs stay in the feature module.
