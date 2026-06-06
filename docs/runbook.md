# EWS Reference App Runbook

This runbook is the final demo/operator guide for EWS Reference App. It covers local run, smoke checks, API examples, the demo script, Railway deployment notes, and known limitations.

## Purpose

EWS Reference App demonstrates frontend-backend interaction patterns around a small `WorkItem` domain object:

- classic server-confirmed update
- polling and external changes
- optimistic update and rollback
- async command flow
- DEV panel controlled edge cases
- conflict handling
- stale response protection

The app is a reference/demo stand, not a production business product.

## Local Prerequisites

- Java 21
- Maven, or Docker for Maven-based backend test execution
- Node.js 22-compatible environment
- npm
- Docker and Docker Compose for container checks

## Local Run

Install frontend dependencies once:

```bash
cd frontend
npm install
```

Run backend:

```bash
cd backend
mvn spring-boot:run
```

Run frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open:

- frontend: http://localhost:5173
- backend health: http://localhost:8080/api/health
- Swagger UI: http://localhost:8080/swagger-ui.html

## Docker Compose Run

```bash
docker compose build
docker compose up
```

Compose starts:

- backend: http://localhost:8080
- frontend: http://localhost:5173

Stop with:

```bash
docker compose down
```

## Smoke Checks

Backend:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/work-items
```

Expected health:

```json
{
  "status": "ok",
  "service": "ews-reference-backend"
}
```

Frontend:

- open http://localhost:5173
- confirm backend health is visible
- confirm WorkItems list is visible
- select a WorkItem and confirm details are visible
- open DEV panel and confirm settings load

## Tests

Backend:

```bash
cd backend
mvn test
```

If local Maven is unavailable:

```bash
docker run --rm -v "$PWD/backend:/workspace/backend:ro" maven:3.9.9-eclipse-temurin-21 \
  bash -lc 'cp -R /workspace/backend /tmp/backend && cd /tmp/backend && mvn -q test'
```

Frontend:

```bash
cd frontend
npm test -- --run
npm run build
```

Forbidden naming validation should be run with the project-standard forbidden-name grep from the task instructions. Expected result: no matches.

## API Examples

List WorkItems:

```bash
curl http://localhost:8080/api/work-items
```

Get one WorkItem:

```bash
curl http://localhost:8080/api/work-items/wi-1
```

Classic partial update:

```bash
curl -X PATCH http://localhost:8080/api/work-items/wi-1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review intake",
    "status": "in_progress",
    "priority": "high",
    "assignee": "Alex",
    "tags": ["intake", "backend", "demo"]
  }'
```

Submit async command:

```bash
curl -X POST http://localhost:8080/api/work-items/wi-1/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"complete"}'
```

Check command status:

```bash
curl http://localhost:8080/api/commands/op-1
```

Reset demo state:

```bash
curl -X POST http://localhost:8080/api/dev/reset
```

External change:

```bash
curl -X POST http://localhost:8080/api/dev/work-items/wi-1/external-change
```

Force next PATCH failure:

```bash
curl -X POST http://localhost:8080/api/dev/fail-next-request
```

Force next async command failure:

```bash
curl -X POST http://localhost:8080/api/dev/fail-next-command
```

Trigger conflict:

```bash
curl -X POST http://localhost:8080/api/dev/trigger-conflict
```

Trigger stale response:

```bash
curl -X POST http://localhost:8080/api/dev/trigger-stale-response
```

## Demo Script

Use this order for a complete demo. Start from reset state:

```bash
curl -X POST http://localhost:8080/api/dev/reset
```

### 1. Baseline

1. Open http://localhost:5173.
2. Confirm backend health is visible.
3. Confirm WorkItems list is visible.
4. Select `wi-1 / Review intake`.
5. Point out status, priority, revision, updatedAt, tags, and pending operation state.

Expected result: seeded data starts at revision `1`.

### 2. Classic Update

1. Select a WorkItem.
2. Click `Редактировать`.
3. Change status or priority.
4. Click `Сохранить`.

Expected result:

- form controls are disabled while saving
- UI waits for backend confirmation
- success feedback appears
- revision increments only after the backend response

### 3. Polling And External Change

1. Keep polling enabled.
2. Open DEV panel.
3. Click `External change для selected WorkItem`.
4. Observe list/details update through polling.

Expected result:

- status toggles to `blocked` or `in_progress`
- tag `external-change` appears
- revision increments
- no manual page reload is needed

### 4. Optimistic Rollback

1. Open DEV panel.
2. Click `Fail next request`.
3. Edit selected WorkItem.
4. Click `Сохранить optimistic`.

Expected result:

- optimistic value appears immediately
- backend returns `DEV_FORCED_FAILURE`
- optimistic cache patch rolls back
- error feedback explains the rollback

### 5. Async Command

1. Select a WorkItem that is not already pending.
2. Click `Запустить async complete`.
3. Observe pending operation and command status.

Expected result:

- backend returns `202 Accepted`
- `pendingOperation` appears
- command status polling runs
- after delayed completion, status becomes `done`
- `pendingOperation` clears
- revision increments

Optional failure demo:

1. Reset state.
2. Open DEV panel.
3. Click `Fail next command`.
4. Start async command.

Expected result: command is accepted, later becomes `failed`, and WorkItem status is not forced to `done`.

### 6. DEV Panel

1. Open DEV panel.
2. Review settings summary.
3. Change backend delay, stale response mode, or conflict mode.
4. Save settings.
5. Use one-shot actions.
6. Click reset.

Expected result:

- actions show success/error feedback
- selected WorkItem action is disabled when no item is selected
- reset restores deterministic seed data and clears local API cache

### 7. Conflict Handling

1. Reset state.
2. Select a WorkItem.
3. Open DEV panel.
4. Click `Trigger conflict`.
5. Edit the selected WorkItem.
6. Click `Сохранить` or `Сохранить optimistic`.

Expected result:

- next PATCH returns `409 DEV_CONFLICT`
- UI shows `Конфликт версий`
- client/server revision details appear
- user can click `Обновить с backend` or `Отменить редактирование`

### 8. Stale Response Handling

1. Reset state.
2. Create a newer revision through classic save or external change.
3. Open DEV panel.
4. Click `Trigger stale response`.
5. Let polling or selected details read run.

Expected result:

- backend returns a controlled lower revision once
- frontend ignores the stale item
- newest known revision remains visible
- state log shows a stale ignored event

## Railway Deploy

Railway deployment is documented in detail in `docs/deploy-railway.md`.

Target architecture:

- Railway project: `ews-reference-app`
- backend service:
  - root directory: `backend`
  - public URL required
  - env: `ALLOWED_ORIGINS=https://<frontend-public-url>`
- frontend service:
  - root directory: `frontend`
  - public URL required
  - env: `VITE_API_BASE_URL=https://<backend-public-url>`

Important Railway notes:

- `PORT` is normally provided by Railway.
- `VITE_API_BASE_URL` is embedded at Vite build time.
- Redeploy/rebuild frontend after changing `VITE_API_BASE_URL`.
- Redeploy backend after changing `ALLOWED_ORIGINS`.
- Backend in-memory data resets on restart or redeploy.

Railway smoke checks:

```bash
curl https://<backend-public-url>/api/health
curl https://<backend-public-url>/api/work-items
```

Then open frontend public URL and run the same scenario script.

## Known Limitations

- Storage is in memory; all WorkItems, command operations, and DEV flags reset on backend restart or deploy.
- There is no auth or user identity.
- There is no external database, Redis, queue, worker, or WebSocket.
- Async command flow uses an in-process scheduled executor, not a durable queue.
- DEV panel endpoints are local demo/test controls, not production admin APIs.
- Conflict and stale scenarios are deterministic reference flows, not full multi-user collaboration.
- There is no merge editor, compare editor, or force overwrite flow.
- Railway preparation is documented, but actual Railway service creation is manual unless done separately.

## Troubleshooting

If frontend cannot reach backend:

- check `VITE_API_BASE_URL`
- check backend `/api/health`
- check backend CORS `ALLOWED_ORIGINS`
- rebuild/redeploy frontend after env changes

If demo state looks inconsistent:

```bash
curl -X POST http://localhost:8080/api/dev/reset
```

If a command remains pending longer than expected:

- check `GET /api/commands/{operationId}`
- reset backend state if this is only a demo session

If stale/conflict scenarios do not trigger:

- reset backend state
- arm the DEV trigger again
- make sure the next eligible request is the one expected by the script
