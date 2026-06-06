# DEV Panel Plan

The DEV panel is planned for a later stage and is not implemented in the scaffold.

## Goals

- simulate latency
- simulate backend errors
- simulate conflicts
- simulate stale polling responses
- reset in-memory demo data

## API Boundary

DEV endpoints should be separated from domain endpoints, for example under `/api/dev`. DEV controls should be clearly excluded from normal domain behavior.
