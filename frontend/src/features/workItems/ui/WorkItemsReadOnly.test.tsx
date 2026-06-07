import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { staleResponseIgnored } from '../model/workItemEventsSlice';
import type { CommandOperation, UpdateWorkItemRequest, WorkItem } from '../model/workItem';
import { WorkItemsReadOnly } from './WorkItemsReadOnly';
import { apiBaseUrl, apiError, cloneWorkItems, server } from '../../../test/server';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('WorkItemsReadOnly', () => {
  it('shows loading state while WorkItems are loading', () => {
    renderWithProviders(<WorkItemsReadOnly />);

    expect(screen.getByText('Загружаем WorkItems')).toBeInTheDocument();
  });

  it('renders WorkItem list and selected details from the API', async () => {
    renderWithProviders(<WorkItemsReadOnly />);

    expect(await screen.findByRole('button', { name: /Review intake/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prepare field validation/ })).toBeInTheDocument();
    expect(await screen.findByText('Этап 11: prefetch прогревает details на hover/focus, а UI показывает состояние polling, revision, операций и edge cases компактно.')).toBeInTheDocument();
    expect(screen.getAllByText('rev 1').length).toBeGreaterThan(0);
  });

  it('prefetches detail data when a row is hovered', async () => {
    const detailCalls: string[] = [];
    server.use(
      http.get(`${apiBaseUrl}/work-items/:id`, ({ params }) => {
        detailCalls.push(String(params.id));
        const workItem = cloneWorkItems().find((item) => item.id === params.id);
        return HttpResponse.json(workItem);
      })
    );

    renderWithProviders(<WorkItemsReadOnly />);

    const secondRow = await screen.findByRole('button', { name: /Prepare field validation/ });
    fireEvent.mouseEnter(secondRow);

    await waitFor(() => expect(detailCalls).toContain('wi-2'));
  });

  it('shows backend unavailable error state', async () => {
    server.use(
      http.get(`${apiBaseUrl}/work-items`, () =>
        HttpResponse.json(apiError(500, 'INTERNAL_ERROR', 'Backend unavailable.'), { status: 500 })
      )
    );

    renderWithProviders(<WorkItemsReadOnly />);

    expect(await screen.findByText(/WorkItems недоступны/)).toBeInTheDocument();
  });

  it('shows empty state when backend returns no WorkItems', async () => {
    server.use(http.get(`${apiBaseUrl}/work-items`, () => HttpResponse.json([])));

    renderWithProviders(<WorkItemsReadOnly />);

    expect(await screen.findByText('WorkItems не найдены')).toBeInTheDocument();
    expect(screen.getByText(/Seed data можно восстановить через DEV panel reset/)).toBeInTheDocument();
  });

  it('opens edit mode and cancel resets the draft', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WorkItemsReadOnly />);

    await user.click(await screen.findByRole('button', { name: 'Редактировать' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Changed locally');
    expect(screen.getByDisplayValue('Changed locally')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(screen.queryByDisplayValue('Changed locally')).not.toBeInTheDocument();
    expect(screen.getAllByText('Review intake').length).toBeGreaterThan(0);
  });

  it('classic save sends PATCH and shows server-confirmed feedback', async () => {
    const user = userEvent.setup();
    const patchSpy = vi.fn();
    server.use(
      http.patch(`${apiBaseUrl}/work-items/:id`, async ({ params, request }) => {
        const changes = (await request.json()) as UpdateWorkItemRequest;
        patchSpy(params.id, changes);
        return HttpResponse.json({
          ...cloneWorkItems()[0],
          ...changes,
          revision: 2,
          updatedAt: '2026-06-06T00:02:00Z',
        });
      })
    );

    renderWithProviders(<WorkItemsReadOnly />);

    await user.click(await screen.findByRole('button', { name: 'Редактировать' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Server confirmed title');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(patchSpy).toHaveBeenCalledWith('wi-1', expect.objectContaining({
      title: 'Server confirmed title',
    })));
    expect(await screen.findByText('Изменения сохранены')).toBeInTheDocument();
  });

  it('optimistic save rolls back when backend returns ApiError', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${apiBaseUrl}/work-items/:id`, () =>
        HttpResponse.json(
          apiError(500, 'DEV_FORCED_FAILURE', 'DEV forced failure for WorkItem PATCH.'),
          { status: 500 }
        )
      )
    );

    renderWithProviders(<WorkItemsReadOnly />);

    await user.click(await screen.findByRole('button', { name: 'Редактировать' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Optimistic title');
    await user.click(screen.getByRole('button', { name: 'Сохранить optimistic' }));

    expect(await screen.findByText(/DEV_FORCED_FAILURE/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Optimistic title')).not.toBeInTheDocument();
  });

  it('renders conflict state for 409 conflict ApiError', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${apiBaseUrl}/work-items/:id`, () =>
        HttpResponse.json(
          apiError(409, 'DEV_CONFLICT', 'The WorkItem has changed on the server.', {
            workItemId: 'wi-1',
            clientRevision: 0,
            serverRevision: 2,
            serverWorkItem: { ...cloneWorkItems()[0], revision: 2 },
          }),
          { status: 409 }
        )
      )
    );

    renderWithProviders(<WorkItemsReadOnly />);

    await user.click(await screen.findByRole('button', { name: 'Редактировать' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Conflicting title');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText('Конфликт версий')).toBeInTheDocument();
    expect(screen.getByText(/client rev 0/)).toBeInTheDocument();
    expect(screen.getByText(/server rev 2/)).toBeInTheDocument();
  });

  it('renders stale ignored event in the state log', async () => {
    const { store } = renderWithProviders(<WorkItemsReadOnly />);

    await screen.findByRole('button', { name: /Review intake/ });
    store.dispatch(
      staleResponseIgnored({
        workItemId: 'wi-1',
        incomingRevision: 1,
        currentRevision: 2,
        source: 'list',
      })
    );

    expect(await screen.findByText(/wi-1: stale list rev 1 ignored, kept rev 2/)).toBeInTheDocument();
  });

  it('handles completed async command once when WorkItem polling still has stale pendingOperation', async () => {
    const user = userEvent.setup();
    const items = cloneWorkItems();
    const workItem = items.find((item) => item.id === 'wi-2') as WorkItem;
    const command: CommandOperation = {
      operationId: 'op-async',
      status: 'pending',
      workItemId: 'wi-2',
      resultRevision: null,
      error: null,
      createdAt: '2026-06-06T00:01:00Z',
      completedAt: null,
    };

    server.use(
      http.get(`${apiBaseUrl}/work-items`, () =>
        HttpResponse.json(items.map((item) => ({ ...item, tags: [...item.tags] })))
      ),
      http.get(`${apiBaseUrl}/work-items/:id`, ({ params }) => {
        const item = items.find((candidate) => candidate.id === params.id);
        if (!item) {
          return HttpResponse.json(apiError(404, 'WORK_ITEM_NOT_FOUND', 'WorkItem was not found.'), {
            status: 404,
          });
        }
        return HttpResponse.json({ ...item, tags: [...item.tags] });
      }),
      http.post(`${apiBaseUrl}/work-items/:id/commands`, ({ params }) => {
        workItem.pendingOperation = 'op-async';
        workItem.revision = 2;
        workItem.updatedAt = '2026-06-06T00:01:00Z';
        return HttpResponse.json({ ...command, workItemId: params.id as string }, { status: 202 });
      }),
      http.get(`${apiBaseUrl}/commands/:operationId`, ({ params }) =>
        HttpResponse.json({
          ...command,
          operationId: params.operationId as string,
          status: 'completed',
          resultRevision: 3,
          completedAt: '2026-06-06T00:02:00Z',
        })
      )
    );

    renderWithProviders(<WorkItemsReadOnly />);

    await user.click(await screen.findByRole('button', { name: /Prepare field validation/ }));
    await user.click(screen.getByRole('button', { name: 'Запустить async complete' }));

    expect(await screen.findByText('Async command op-async принята backend.')).toBeInTheDocument();
    expect(await screen.findByText('Async command op-async завершена.')).toBeInTheDocument();
    expect(screen.getAllByText(/wi-2: command op-async completed/)).toHaveLength(1);
  });
});
