import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import Page from '../routes/clicker/[id]/+page.svelte';
import { getDb, COLLECTIONS } from '$lib/db';

async function seedClicker(name: string): Promise<string> {
  const db = await getDb();
  const { rkey } = await db.createRecord({
    collection: COLLECTIONS.CLICKER,
    record: { name, createdAt: new Date().toISOString() },
  });
  return rkey;
}

describe('Recording page', () => {
  it('shows "not found" when the id does not match any clicker', async () => {
    page.set({ params: { id: 'no-such-id' }, url: get(page).url });
    render(Page);
    await waitFor(() => {
      expect(screen.getByText(/Clicker not found/)).toBeInTheDocument();
    });
  });

  it('displays the clicker name after loading', async () => {
    const rkey = await seedClicker('Sprint Counter');
    page.set({ params: { id: rkey }, url: get(page).url });

    render(Page);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sprint Counter' })).toBeInTheDocument();
    });
  });

  it('starts with an event count of 0', async () => {
    const rkey = await seedClicker('Empty');
    page.set({ params: { id: rkey }, url: get(page).url });

    render(Page);
    await waitFor(() => screen.getByRole('heading', { name: 'Empty' }));
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('increments the count each time the button is clicked', async () => {
    const rkey = await seedClicker('Counter');
    page.set({ params: { id: rkey }, url: get(page).url });

    render(Page);
    await waitFor(() => screen.getByRole('button', { name: 'Record event' }));

    await fireEvent.click(screen.getByRole('button', { name: 'Record event' }));
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    await fireEvent.click(screen.getByRole('button', { name: 'Record event' }));
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  it('persists events to the database', async () => {
    const rkey = await seedClicker('Persisted');
    page.set({ params: { id: rkey }, url: get(page).url });

    render(Page);
    await waitFor(() => screen.getByRole('button', { name: 'Record event' }));

    await fireEvent.click(screen.getByRole('button', { name: 'Record event' }));
    await waitFor(() => screen.getByText('1'));

    const db = await getDb();
    const count = await db.countRecords(COLLECTIONS.EVENT, { clickerId: rkey });
    expect(count).toBe(1);
  });

  it('reflects pre-existing events in the initial count', async () => {
    const rkey = await seedClicker('Pre-loaded');
    const db = await getDb();
    // Write three events before the page loads.
    for (let i = 0; i < 3; i++) {
      await db.createRecord({
        collection: COLLECTIONS.EVENT,
        record: { clickerId: rkey, timestamp: new Date().toISOString() },
      });
    }
    page.set({ params: { id: rkey }, url: get(page).url });

    render(Page);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
