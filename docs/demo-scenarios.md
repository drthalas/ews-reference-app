# Demo Scenarios

This is the finalized compact scenario checklist for EWS Reference App. Use `docs/runbook.md` for the full operator script, commands, local run instructions, Railway deploy notes, and troubleshooting.

Before every demo session, reset backend state from the DEV panel or through:

```bash
curl -X POST http://localhost:8080/api/dev/reset
```

## 1. Initial WorkItem Load

- API: `GET /api/work-items`, optionally `GET /api/work-items/{id}` after selection or prefetch.
- UI: WorkItems list appears with status, priority, assignee, revision, pending operation, and updated timestamp.
- Expected result: first seeded item is `wi-1 / Review intake`, revision `1`.
- Recovery: if the list fails, verify `GET /api/health`, reset backend state, and retry.

## 2. Classic Server-Confirmed Update

- API: `PATCH /api/work-items/{id}`.
- UI path: select a WorkItem, click `Редактировать`, change title/status/priority/assignee/tags, click `Сохранить`.
- Expected result: controls are disabled while saving; UI updates only after backend response; revision increments on actual change; success feedback appears.
- Recovery: validation errors keep edit mode open and preserve the draft.

## 3. Polling And External Change

- API: repeated `GET /api/work-items`; demo action calls `POST /api/dev/work-items/{id}/external-change`.
- UI path: keep polling enabled, open DEV panel, trigger external change for selected WorkItem.
- Expected result: polling refresh brings in the changed status/tag/revision without manual page reload.
- Recovery: if polling is off, enable it or click `Обновить`.

## 4. Optimistic Rollback

- API: `POST /api/dev/fail-next-request`, then optimistic `PATCH /api/work-items/{id}`.
- UI path: open DEV panel, click `Fail next request`, edit selected WorkItem, click `Сохранить optimistic`.
- Expected result: UI applies the optimistic draft immediately, backend returns `DEV_FORCED_FAILURE`, cache rolls back, and an error explains the rollback.
- Recovery: repeat save without arming `Fail next request`; the next PATCH should behave normally.

## 5. Async Command

- API: `POST /api/work-items/{id}/commands`, then `GET /api/commands/{operationId}`.
- UI path: select a WorkItem and click `Запустить async complete`.
- Expected result: backend returns `202 Accepted`, WorkItem shows `pendingOperation`, command status polling starts, delayed completion sets status to `done`, clears `pendingOperation`, and increments revision.
- Recovery: use DEV panel `Fail next command` before command submission to demonstrate command failure without corrupting WorkItem state.

## 6. DEV Panel

- API: `GET /api/dev/settings`, `PUT /api/dev/settings`, `POST /api/dev/reset`, and one-shot DEV actions.
- UI path: open `DEV panel`.
- Expected result: settings are shown, selected WorkItem id is visible, selected-item actions are disabled when nothing is selected, and every DEV action gives success/error feedback.
- Recovery: `Reset backend state` restores deterministic seed WorkItems, clears pending commands, clears DEV flags, and clears frontend RTK Query cache.

## 7. Conflict Handling

- API: `POST /api/dev/trigger-conflict`, then `PATCH /api/work-items/{id}`.
- UI path: open DEV panel, click `Trigger conflict`, edit selected WorkItem, save with classic or optimistic save.
- Expected result: next PATCH returns `409 DEV_CONFLICT`; UI shows `Конфликт версий`, client/server revision chips, and actions `Обновить с backend` and `Отменить редактирование`.
- Recovery: click `Обновить с backend` to refetch and exit edit mode, or `Отменить редактирование` to discard the draft.

## 8. Stale Response Handling

- API: `POST /api/dev/trigger-stale-response`, then next `GET /api/work-items` or `GET /api/work-items/{id}`.
- UI path: first create a newer revision through edit or external change, then trigger stale response from DEV panel.
- Expected result: frontend compares revisions, ignores the older incoming WorkItem, keeps the freshest cache entry, and records `Stale response ignored` in state log/details.
- Recovery: next normal polling/read confirms current state.

## 9. Prefetch And UX State Review

- API: `GET /api/work-items/{id}`.
- UI path: hover or focus a WorkItem row before selecting it.
- Expected result: details are prefetched through RTK Query; selecting the item can reuse warmed detail cache. Loading, refetch, operation, stale, conflict, and polling states remain compact and visible.
- Recovery: if prefetch fails, selecting the item performs the normal detail request and shows the standard details error state if needed.
