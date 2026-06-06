import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { DevSettings } from '../features/devPanel/model/devSettings';
import type { ApiError, WorkItem } from '../features/workItems/model/workItem';

export const apiBaseUrl = 'http://localhost:8080/api';

export const seedWorkItems: WorkItem[] = [
  {
    id: 'wi-1',
    title: 'Review intake',
    status: 'new',
    priority: 'medium',
    assignee: 'Alex',
    tags: ['intake', 'backend'],
    revision: 1,
    updatedAt: '2026-06-06T00:00:00Z',
    pendingOperation: null,
  },
  {
    id: 'wi-2',
    title: 'Prepare field validation',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Morgan',
    tags: ['validation'],
    revision: 1,
    updatedAt: '2026-06-06T00:00:00Z',
    pendingOperation: null,
  },
];

export const seedDevSettings: DevSettings = {
  responseDelayMs: 0,
  failNextRequest: false,
  failNextCommand: false,
  staleResponseMode: false,
  conflictMode: false,
  lastResetAt: '2026-06-06T00:00:00Z',
  lastDevAction: 'initial seed',
};

export function cloneWorkItems() {
  return seedWorkItems.map((workItem) => ({ ...workItem, tags: [...workItem.tags] }));
}

export function apiError(status: number, code: string, message: string, details: Record<string, unknown> = {}): ApiError {
  return {
    status,
    code,
    message,
    details,
    timestamp: '2026-06-06T00:00:00Z',
  };
}

export const defaultHandlers = [
  http.get(`${apiBaseUrl}/work-items`, () => HttpResponse.json(cloneWorkItems())),
  http.get(`${apiBaseUrl}/work-items/:id`, ({ params }) => {
    const workItem = cloneWorkItems().find((item) => item.id === params.id);
    if (!workItem) {
      return HttpResponse.json(apiError(404, 'WORK_ITEM_NOT_FOUND', 'WorkItem was not found.'), {
        status: 404,
      });
    }
    return HttpResponse.json(workItem);
  }),
  http.patch(`${apiBaseUrl}/work-items/:id`, async ({ params, request }) => {
    const changes = (await request.json()) as Partial<WorkItem>;
    const workItem = cloneWorkItems().find((item) => item.id === params.id);
    if (!workItem) {
      return HttpResponse.json(apiError(404, 'WORK_ITEM_NOT_FOUND', 'WorkItem was not found.'), {
        status: 404,
      });
    }
    return HttpResponse.json({
      ...workItem,
      ...changes,
      revision: workItem.revision + 1,
      updatedAt: '2026-06-06T00:01:00Z',
    });
  }),
  http.post(`${apiBaseUrl}/work-items/:id/commands`, ({ params }) =>
    HttpResponse.json(
      {
        operationId: 'op-1',
        status: 'pending',
        workItemId: params.id,
        resultRevision: null,
        error: null,
        createdAt: '2026-06-06T00:01:00Z',
        completedAt: null,
      },
      { status: 202 }
    )
  ),
  http.get(`${apiBaseUrl}/commands/:operationId`, ({ params }) =>
    HttpResponse.json({
      operationId: params.operationId,
      status: 'pending',
      workItemId: 'wi-1',
      resultRevision: null,
      error: null,
      createdAt: '2026-06-06T00:01:00Z',
      completedAt: null,
    })
  ),
  http.get(`${apiBaseUrl}/dev/settings`, () => HttpResponse.json(seedDevSettings)),
  http.put(`${apiBaseUrl}/dev/settings`, async ({ request }) =>
    HttpResponse.json({ ...seedDevSettings, ...((await request.json()) as Partial<DevSettings>) })
  ),
  http.post(`${apiBaseUrl}/dev/reset`, () => HttpResponse.json(seedDevSettings)),
  http.post(`${apiBaseUrl}/dev/fail-next-request`, () =>
    HttpResponse.json({ ...seedDevSettings, failNextRequest: true })
  ),
  http.post(`${apiBaseUrl}/dev/fail-next-command`, () =>
    HttpResponse.json({ ...seedDevSettings, failNextCommand: true })
  ),
  http.post(`${apiBaseUrl}/dev/trigger-stale-response`, () =>
    HttpResponse.json({ ...seedDevSettings, staleResponseMode: true })
  ),
  http.post(`${apiBaseUrl}/dev/trigger-conflict`, () =>
    HttpResponse.json({ ...seedDevSettings, conflictMode: true })
  ),
  http.post(`${apiBaseUrl}/dev/work-items/:id/external-change`, ({ params }) => {
    const workItem = cloneWorkItems().find((item) => item.id === params.id);
    if (!workItem) {
      return HttpResponse.json(apiError(404, 'WORK_ITEM_NOT_FOUND', 'WorkItem was not found.'), {
        status: 404,
      });
    }
    return HttpResponse.json({
      ...workItem,
      status: 'blocked',
      tags: [...workItem.tags, 'external-change'],
      revision: workItem.revision + 1,
      updatedAt: '2026-06-06T00:01:00Z',
    });
  }),
];

export const server = setupServer(...defaultHandlers);
