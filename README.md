# EWS Reference App

EWS Reference App is a reference application for demonstrating common frontend-backend patterns in an EWS-like interface. It is not a business product. The project focuses on reproducible mechanics, clear layer boundaries, and a compact local environment.

## Current Status

Stages 1 through 13 are complete. The app is ready as a local reference/demo stand.

Implemented:

- React, TypeScript, Vite frontend
- Redux Toolkit and RTK Query setup
- MUI application shell
- Spring Boot backend with health endpoint
- OpenAPI and Swagger UI
- Docker Compose for local frontend and backend services
- Architecture and roadmap documentation
- Backend WorkItem list/detail/patch API with deterministic in-memory data
- Read-only frontend WorkItem list/detail integration through RTK Query
- Server-confirmed frontend WorkItem edit flow with RTK Query cache invalidation
- WorkItem polling controls and external-change demo endpoint
- Railway demo-deploy preparation for separate frontend and backend services
- Optimistic WorkItem save flow with rollback on backend error
- Async WorkItem command flow with pending operation state and delayed completion
- DEV panel for backend-controlled edge cases: delay, failures, external change, stale response, conflict, and reset
- Conflict handling UI with reload/cancel actions
- Stale response protection through WorkItem revision comparison
- WorkItem detail prefetch on row hover/focus
- UX polish for loading, empty, error, polling, command, revision, and DEV states
- Expanded backend MockMvc and frontend Vitest/React Testing Library/MSW test coverage
- Final demo documentation, runbook, API examples, demo script, and known limitations

Documentation:

- compact project context in `docs/context.md`
- execution map in `docs/tasks.md`
- final runbook in `docs/runbook.md`
- finalized demo scenarios in `docs/demo-scenarios.md`
- refined API, architecture, state, polling, optimistic update, async command, conflict, DEV panel, demo, deploy, and roadmap docs

## Tech Stack

- Frontend: React, TypeScript, Vite, Redux Toolkit, RTK Query, MUI
- Backend: Java 21, Spring Boot, springdoc-openapi
- Infrastructure: Docker Compose
- Future storage: in-memory backend state

## Project Structure

```text
.
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── docs/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── .editorconfig
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Local Run

Install frontend dependencies once:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm run dev
```

Open:

- frontend: http://localhost:5173
- backend health: http://localhost:8080/api/health
- Swagger: http://localhost:8080/swagger-ui.html

If local Maven is unavailable, use Docker Compose:

```bash
docker compose build
docker compose up
```

## Docker Compose

```bash
docker compose build
docker compose up
```

## Tests

Backend:

```bash
cd backend
mvn test
```

If local Maven is unavailable, run the same tests through Docker Maven.

Frontend:

```bash
cd frontend
npm test -- --run
```

## Railway Demo Deploy

Railway deployment is documented in `docs/deploy-railway.md`.

Target Railway project:

- `ews-reference-app`

Target services:

- `backend`, root directory `backend`
- `frontend`, root directory `frontend`

Required Railway env:

- backend: `ALLOWED_ORIGINS=https://<frontend-public-url>`
- frontend: `VITE_API_BASE_URL=https://<backend-public-url>`
- frontend: `VITE_SWAGGER_URL=https://<backend-public-url>/swagger-ui.html`

Vite env values are embedded at build time. Redeploy/rebuild the frontend service after changing `VITE_API_BASE_URL` or `VITE_SWAGGER_URL`.

## URLs

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/health
- Backend WorkItems: http://localhost:8080/api/work-items
- Backend Commands: http://localhost:8080/api/commands/{operationId}
- Backend DEV settings: http://localhost:8080/api/dev/settings
- Backend external-change demo: POST http://localhost:8080/api/dev/work-items/wi-1/external-change
- Backend fail-next-request demo: POST http://localhost:8080/api/dev/fail-next-request
- Backend fail-next-command demo: POST http://localhost:8080/api/dev/fail-next-command
- Backend trigger-stale-response demo: POST http://localhost:8080/api/dev/trigger-stale-response
- Backend trigger-conflict demo: POST http://localhost:8080/api/dev/trigger-conflict
- Backend reset demo state: POST http://localhost:8080/api/dev/reset
- Swagger: http://localhost:8080/swagger-ui.html

## API Examples

List WorkItems:

```bash
curl http://localhost:8080/api/work-items
```

Update a WorkItem:

```bash
curl -X PATCH http://localhost:8080/api/work-items/wi-1 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","priority":"high","tags":["intake","backend","demo"]}'
```

Run an async command:

```bash
curl -X POST http://localhost:8080/api/work-items/wi-1/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"complete"}'
```

Trigger rollback demo:

```bash
curl -X POST http://localhost:8080/api/dev/fail-next-request
```

Trigger conflict demo:

```bash
curl -X POST http://localhost:8080/api/dev/trigger-conflict
```

## Demo Runbook

Use `docs/runbook.md` as the primary demo script. It covers:

- local run and smoke checks
- Railway deploy summary
- API examples
- classic update
- polling and external changes
- optimistic rollback
- async command
- DEV panel controls
- conflict handling
- stale response handling
- known limitations

## Known Limitations

- Backend storage is in memory and resets on restart/redeploy.
- There is no auth, external DB, Redis, WebSocket, external queue, or multi-user model.
- DEV endpoints are local demo controls, not production admin APIs.
- Conflict/stale scenarios are deterministic demos, not a full collaborative editing system.
- Railway deployment is prepared and documented; actual Railway service creation remains manual unless performed separately.
