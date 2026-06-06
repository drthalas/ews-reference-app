# Frontend Architecture

The frontend is a Vite React application written in TypeScript.

## Layers

- `app/` contains the root component, store, and providers.
- `shared/api/` contains the base RTK Query API setup.
- `features/` contains feature modules with local API bindings and UI.

## Server State

RTK Query owns server state. Feature APIs inject endpoints into the shared base API.

## UI State

Redux slices may be added later for UI-only state. Server data should not be duplicated in UI slices unless a feature has a clear temporary editing need.

## Styling

MUI provides layout, typography, controls, and theme configuration. Components should stay compact and oriented toward repeated operational use.

## Future Module

The future `workItems` frontend feature will contain WorkItem API bindings, list UI, edit controls, and scenario-specific state where needed.
