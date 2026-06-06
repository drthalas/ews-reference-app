# Frontend Architecture

The frontend is a Vite React application written in TypeScript.

Stage 6 adds WorkItem polling and a minimal external-change demo through RTK Query while keeping the application shell and health query visible.

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
- external-change demo mutation
- polling options for active WorkItem queries

Later stages will add optimistic cache updates, async command submission, command status lookup, broader DEV controls, and conflict/stale handling.

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
- the external-change demo button calls the backend `/api/dev` helper and does not create optimistic local data

Later stages will add prefetch, conflict state, optimistic update, rollback, and async command behavior.

## Stale Response Protection

Stage 6 displays WorkItem revisions and update timestamps. Full stale response protection is planned for the conflict/stale stage, where the frontend must compare incoming revisions with the newest revision already known for each item.

## Styling

MUI provides layout, typography, controls, and theme configuration. Components should stay compact and oriented toward repeated operational use.

## Module Boundary

The `workItems` frontend feature contains WorkItem API bindings, list UI, detail UI, classic edit controls, polling controls, and the minimal external-change demo action. Shared API transport stays in `shared/api/baseApi.ts`; domain-specific DTOs stay in the feature module.
