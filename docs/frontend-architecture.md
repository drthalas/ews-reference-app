# Frontend Architecture

The frontend is a Vite React application written in TypeScript.

Stage 2 documents the future shape only. The current runtime still contains the application shell and health query.

## Layers

- `app/` contains the root component, store, and providers.
- `shared/api/` contains the base RTK Query API setup.
- `features/` contains feature modules with local API bindings and UI.

## Server State

RTK Query owns server state. Feature APIs inject endpoints into the shared base API.

Future WorkItem server state belongs in a `features/workItems/api` module. It should define typed endpoints for:

- list retrieval
- detail retrieval
- server-confirmed patch updates
- async command submission
- command status lookup
- DEV endpoint calls when DEV controls are introduced

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

The future WorkItem feature should be compact and operational:

- list rows display title, status, priority, assignee, revision, and update state
- row actions submit narrow updates or commands
- detail view can be prefetched before navigation
- conflict state is visible and offers refresh/retry choices
- polling state is visible without replacing newer local/server data

## Stale Response Protection

The frontend must compare incoming WorkItem revisions with the newest revision already known for each item. Older responses should be ignored for entity replacement and may still be surfaced as a demo event in DEV scenarios.

## Styling

MUI provides layout, typography, controls, and theme configuration. Components should stay compact and oriented toward repeated operational use.

## Module Boundary

The future `workItems` frontend feature will contain WorkItem API bindings, list UI, edit controls, and scenario-specific state where needed. Shared API transport stays in `shared/api/baseApi.ts`; domain-specific DTOs stay in the feature module.
