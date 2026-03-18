import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Page from './+page.svelte';
import { getDb, COLLECTIONS } from '$lib/db';

describe('Home page', () => {
  it('shows empty state when no clickers exist', async () => {
    render(Page);
    await waitFor(() => {
      expect(screen.getByText('No clickers yet. Create one above.')).toBeInTheDocument();
    });
  });

  it('create button is disabled when input is empty', async () => {
    render(Page);
    await waitFor(() => screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('creates a clicker and shows it in the list', async () => {
    render(Page);
    await waitFor(() => screen.getByPlaceholderText('Clicker name'));

    await fireEvent.input(screen.getByPlaceholderText('Clicker name'), {
      target: { value: 'My Clicker' },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('My Clicker')).toBeInTheDocument();
    });
  });

  it('shows the correct event count for a clicker', async () => {
    // Seed a clicker with two events directly via the DB.
    const db = await getDb();
    const { rkey } = await db.createRecord({
      collection: COLLECTIONS.CLICKER,
      record: { name: 'Seeded', createdAt: new Date().toISOString() },
    });
    await db.createRecord({
      collection: COLLECTIONS.EVENT,
      record: { clickerId: rkey, timestamp: new Date().toISOString() },
    });
    await db.createRecord({
      collection: COLLECTIONS.EVENT,
      record: { clickerId: rkey, timestamp: new Date().toISOString() },
    });

    render(Page);
    await waitFor(() => {
      expect(screen.getByText('2 events')).toBeInTheDocument();
    });
  });

  it('removes a clicker from the list after deletion', async () => {
    const db = await getDb();
    await db.createRecord({
      collection: COLLECTIONS.CLICKER,
      record: { name: 'To Delete', createdAt: new Date().toISOString() },
    });

    render(Page);
    await waitFor(() => screen.getByText('To Delete'));

    // Suppress the confirm dialog and auto-accept.
    global.confirm = () => true;
    await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
    });
  });

  it('clearing input re-disables the create button', async () => {
    render(Page);
    await waitFor(() => screen.getByPlaceholderText('Clicker name'));

    const input = screen.getByPlaceholderText('Clicker name');
    await fireEvent.input(input, { target: { value: 'Something' } });
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();

    await fireEvent.input(input, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });
});
