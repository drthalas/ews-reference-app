# Demo Scenarios

This scaffold does not implement demo scenarios yet.

Future scenarios should document expected UI state, API calls, and recovery behavior. The planned order below matches the roadmap.

## 1. Initial WorkItem List Load

- API: `GET /api/work-items`
- UI: loading state, then compact list with status, priority, assignee, revision, and updated timestamp.
- Recovery: show backend error state if the request fails.

## 2. Server-Confirmed Update

- API: `PATCH /api/work-items/{id}`
- UI: field update waits for server response or shows narrow pending state.
- Recovery: validation errors stay attached to the edited item or field.

## 3. Polling Refresh

- API: repeated `GET /api/work-items`
- UI: background refresh indicator without blocking row interaction.
- Recovery: failed refresh leaves current data visible and shows a refresh error.

## 4. Optimistic Update Success

- API: `PATCH /api/work-items/{id}` with `expectedRevision`
- UI: status or priority changes immediately, then reconciles to server-confirmed revision.
- Recovery: none when successful.

## 5. Optimistic Update Rollback

- API: `POST /api/dev/fail-next-request`, then `PATCH /api/work-items/{id}`
- UI: optimistic value appears, then rolls back on failure.
- Recovery: row-level error explains the failed update.

## 6. Async Command Pending And Completion

- API: `POST /api/work-items/{id}/commands`, then `GET /api/commands/{operationId}`
- UI: command pending indicator, then completed state and refreshed WorkItem.
- Recovery: failed command shows command-specific error without corrupting WorkItem cache.

## 7. Backend Error Display

- API: `POST /api/dev/fail-next-request`, then any normal request.
- UI: current data remains visible when possible; error is scoped to the affected action.
- Recovery: retry returns to normal behavior.

## 8. Conflict Detection

- API: `POST /api/dev/work-items/{id}/external-change`, then `PATCH /api/work-items/{id}` with old `expectedRevision`
- UI: conflict message, rollback of local change, and refreshed server state.
- Recovery: user retries against the new revision.

## 9. Stale Response Handling

- API: `POST /api/dev/trigger-stale-response`, then `GET /api/work-items`
- UI: stale response ignored, newest known revision remains visible.
- Recovery: next normal refresh confirms current data.

## 10. Data Prefetch Before Navigation

- API: `GET /api/work-items/{id}`
- UI: detail route or panel opens with prefetched data when available.
- Recovery: if prefetch fails, detail view performs its own fetch and shows an error if needed.
