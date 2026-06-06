# API Plan

The initial API surface contains only:

- `GET /api/health`

Response:

```json
{
  "status": "ok",
  "service": "ews-reference-backend"
}
```

## Future Domain API

The future WorkItem API should cover:

- list retrieval
- single item retrieval if needed for prefetch scenarios
- server-confirmed update
- command submission for async flows
- command status lookup
- conflict simulation through a separate DEV API

The scaffold does not implement these endpoints yet.
