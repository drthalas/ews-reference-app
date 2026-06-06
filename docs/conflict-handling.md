# Conflict Handling

Conflict handling is planned for a later stage and is not implemented in the scaffold.

## Goals

- demonstrate server rejection when client state is outdated
- show clear user-facing conflict state
- refresh server state after conflict detection
- avoid implicit data loss

## Future Approach

WorkItem records can include a version field. Updates can require the expected version and return a conflict response when the server version has changed.
