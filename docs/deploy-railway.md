# Демо-деплой на Railway

Этот документ описывает подготовленный Railway-only demo deploy для EWS Reference App. Frontend и backend деплоятся как два отдельных Railway service в одном project.

## Целевая архитектура

Railway project:

- `ews-reference-app`

Service 1:

- name: `backend`
- root directory: `backend`
- runtime: Spring Boot в Docker container
- public URL: выдаётся Railway
- health endpoint: `/api/health`

Service 2:

- name: `frontend`
- root directory: `frontend`
- runtime: статический Vite build через nginx в Docker container
- public URL: выдаётся Railway
- backend URL задаётся через `VITE_API_BASE_URL`

Два service нужны потому, что backend и frontend имеют разные runtime, env variables, public URLs и lifecycle. Frontend вызывает backend по публичному backend URL.

## Backend Service

Создать service из GitHub repository:

- repository: `https://github.com/drthalas/ews-reference-app`
- root directory: `backend`
- Dockerfile: `backend/Dockerfile`

Environment variables:

- `PORT`: обычно задаётся Railway автоматически.
- `ALLOWED_ORIGINS=https://<frontend-public-url>`

Backend совместим с Railway port через:

```yaml
server:
  port: ${PORT:8080}
```

CORS читает `ALLOWED_ORIGINS` как comma-separated список. Для локальной разработки defaults уже включают:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:5174`
- `http://127.0.0.1:5174`

Backend checks после deploy:

- `GET https://<backend-public-url>/api/health`
- `GET https://<backend-public-url>/api/work-items`
- `GET https://<backend-public-url>/swagger-ui.html`

Ожидаемый health response:

```json
{
  "status": "ok",
  "service": "ews-reference-backend"
}
```

## Frontend Service

Создать service из того же GitHub repository:

- repository: `https://github.com/drthalas/ews-reference-app`
- root directory: `frontend`
- Dockerfile: `frontend/Dockerfile`

Environment variables:

- `VITE_API_BASE_URL=https://<backend-public-url>`
- `VITE_SWAGGER_URL=https://<backend-public-url>/swagger-ui.html`
- `PORT`: обычно задаётся Railway автоматически.

Frontend Dockerfile собирает production `dist` и отдаёт его через nginx. Runtime слушает `${PORT}`, если Railway его задаёт, иначе default `80`.

Важно: `VITE_API_BASE_URL` и `VITE_SWAGGER_URL` встраиваются Vite на build time. Если backend public URL изменился, нужно обновить оба env values и redeploy/rebuild frontend service.

Frontend checks после deploy:

- frontend public URL открывается в браузере;
- backend health status виден на странице;
- WorkItems list отображается;
- selected WorkItem details отображается;
- ссылка Swagger ведёт на `https://<backend-public-url>/swagger-ui.html`;
- edit WorkItem сохраняет изменения через backend;
- polling status виден;
- кнопка внешнего изменения обновляет backend, а polling подтягивает изменения.

## Порядок ручного deploy

1. Создать Railway project `ews-reference-app`.
2. Подключить GitHub repository `drthalas/ews-reference-app`.
3. Создать service `backend`.
4. Указать root directory `backend`.
5. Deploy backend.
6. Скопировать backend public URL.
7. Создать service `frontend`.
8. Указать root directory `frontend`.
9. Установить frontend env `VITE_API_BASE_URL=https://<backend-public-url>`.
10. Установить frontend env `VITE_SWAGGER_URL=https://<backend-public-url>/swagger-ui.html`.
11. Deploy frontend.
12. Скопировать frontend public URL.
13. Установить backend env `ALLOWED_ORIGINS=https://<frontend-public-url>`.
14. Redeploy backend.
15. Выполнить smoke checks.

## Smoke Checks

Backend:

```bash
curl https://<backend-public-url>/api/health
curl https://<backend-public-url>/api/work-items
curl -X POST https://<backend-public-url>/api/dev/work-items/wi-1/external-change
```

Frontend:

- открыть `https://<frontend-public-url>`;
- убедиться, что health status backend отображается;
- убедиться, что список WorkItems загружен;
- открыть Swagger link и убедиться, что он ведёт на backend public URL;
- выбрать WorkItem и сохранить изменение;
- включить polling;
- нажать `Имитировать внешнее изменение`;
- убедиться, что revision/status/tags обновляются после refresh/polling.

## In-Memory Storage

Backend хранит WorkItem data in memory. На Railway restart или redeploy состояние сбрасывается к deterministic seed data. Это ожидаемое поведение demo app.

## Troubleshooting

Если frontend показывает ошибку backend:

- проверить `VITE_API_BASE_URL` в frontend service;
- проверить `VITE_SWAGGER_URL` в frontend service;
- убедиться, что frontend service был redeployed после изменения `VITE_API_BASE_URL` или `VITE_SWAGGER_URL`;
- проверить backend public URL через `/api/health`;
- проверить `ALLOWED_ORIGINS` в backend service;
- убедиться, что `ALLOWED_ORIGINS` содержит точный frontend public URL без trailing slash;
- redeploy backend после изменения `ALLOWED_ORIGINS`.

Если backend не стартует:

- проверить logs backend service;
- убедиться, что Railway задаёт `PORT`;
- проверить `/api/health`;
- проверить, что root directory service равен `backend`.

Если frontend не стартует:

- проверить logs frontend service;
- убедиться, что root directory service равен `frontend`;
- проверить, что Docker build прошёл;
- проверить, что service слушает Railway `PORT`.

Если CORS всё ещё блокирует запросы:

- открыть browser devtools и посмотреть фактический origin frontend;
- скопировать origin полностью в `ALLOWED_ORIGINS`;
- для нескольких origins использовать comma-separated список без пробелов:
  `https://frontend-one.up.railway.app,https://frontend-two.up.railway.app`;
- redeploy backend.

## Что не входит в этот deploy stage

- optimistic update;
- async command flow;
- conflict/stale scenarios;
- полноценная DEV panel;
- внешняя БД;
- Redis;
- auth;
- WebSocket;
- другие cloud providers.
