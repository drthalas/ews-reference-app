# Backend Architecture

The backend is a Java 21 Spring Boot service named `ews-reference-backend`.

## Package Layout

- `com.ewsreference.app` contains the application entry point.
- `health` contains the health endpoint.
- `common.api` contains shared API DTOs.
- Future `workitem` will contain the WorkItem domain API.

## API Style

The backend exposes REST endpoints under `/api`. Endpoints should return explicit DTOs and predictable error shapes.

## Storage

Future WorkItem data will be stored in memory. This keeps local demos deterministic and avoids database setup.

## Documentation

springdoc-openapi generates OpenAPI documentation and serves Swagger UI at `/swagger-ui.html`.

## Exclusions

The scaffold intentionally excludes external databases, Redis, authorization, WebSocket flows, and multi-user behavior.
