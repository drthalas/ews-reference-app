import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DevPanel } from './DevPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('DevPanel', () => {
  it('opens settings and disables selected WorkItem actions when nothing is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DevPanel selectedWorkItemId={null} onRefreshWorkItems={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /DEV panel/ }));

    expect(await screen.findByText('Current settings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /External change для selected WorkItem/ })).toBeDisabled();
    expect(screen.getByText('selected: none')).toBeInTheDocument();
  });
});
