# EWS Reference App

EWS Reference App is a reference application for demonstrating common frontend-backend patterns in an EWS-like interface. It is not a business product. The project focuses on reproducible mechanics, clear layer boundaries, and a compact local environment.

## Current Status

Stage 1 is complete and Stage 2 is current.

Implemented scaffold:

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

Current documentation stage:

- compact project context in `docs/context.md`
- execution map in `docs/tasks.md`
- refined API, architecture, state, polling, optimistic update, async command, conflict, DEV panel, demo, and roadmap plans

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

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Docker Compose

```bash
docker compose build
docker compose up
```

## URLs

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/health
- Backend WorkItems: http://localhost:8080/api/work-items
- Swagger: http://localhost:8080/swagger-ui.html

## Next Development Stage

The next implementation stage is polling and external data changes. Optimistic update, async commands, DEV panel, conflict scenarios, prefetch, and broader tests are planned but intentionally not implemented in the current scaffold.
