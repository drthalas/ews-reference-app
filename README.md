# EWS Reference App

EWS Reference App is a reference application for demonstrating common frontend-backend patterns in an EWS-like interface. It is not a business product. The project focuses on reproducible mechanics, clear layer boundaries, and a compact local environment.

## Current Status

Initial scaffold:

- React, TypeScript, Vite frontend
- Redux Toolkit and RTK Query setup
- MUI application shell
- Spring Boot backend with health endpoint
- OpenAPI and Swagger UI
- Docker Compose for local frontend and backend services
- Architecture and roadmap documentation

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
- Swagger: http://localhost:8080/swagger-ui.html

## Next Development Stage

The next stage is documentation refinement followed by a minimal backend WorkItem API. Full update flows, polling, optimistic update, async commands, DEV panel, conflict scenarios, prefetch, and tests are planned but intentionally not implemented in this scaffold.
