<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getDb, COLLECTIONS, type ClickerRecord } from '$lib/db';

  let clickers = $state<ClickerRecord[]>([]);
  let loading = $state(true);
  let newName = $state('');
  let creating = $state(false);

  onMount(async () => {
    await loadClickers();
  });

  async function loadClickers() {
    loading = true;
    const db = await getDb();
    const { records } = await db.listRecords({ collection: COLLECTIONS.CLICKER, limit: 100 });
    const withCounts = await Promise.all(
      records.map(async (r) => {
        const rec = r.record as { name: string; createdAt: string };
        const count = await db.countRecords(COLLECTIONS.EVENT, { clickerId: r.rkey });
        return { rkey: r.rkey, name: rec.name, createdAt: rec.createdAt, count };
      })
    );
    clickers = withCounts;
    loading = false;
  }

  async function createClicker() {
    const name = newName.trim();
    if (!name) return;
    creating = true;
    try {
      const db = await getDb();
      await db.createRecord({
        collection: COLLECTIONS.CLICKER,
        record: { name, createdAt: new Date().toISOString() },
      });
      newName = '';
      await loadClickers();
    } finally {
      creating = false;
    }
  }

  async function deleteClicker(rkey: string) {
    const db = await getDb();
    // Delete all events for this clicker
    let cursor: string | undefined;
    do {
      const { records, cursor: next } = await db.listRecords({
        collection: COLLECTIONS.EVENT,
        limit: 100,
        cursor,
        filter: { clickerId: rkey },
      });
      await Promise.all(records.map((e) => db.deleteRecord({ collection: COLLECTIONS.EVENT, rkey: e.rkey })));
      cursor = next;
    } while (cursor);
    await db.deleteRecord({ collection: COLLECTIONS.CLICKER, rkey });
    await loadClickers();
  }

  async function exportCsv(rkey: string, name: string) {
    const db = await getDb();
    const rows: string[] = ['timestamp'];
    let cursor: string | undefined;
    do {
      const { records, cursor: next } = await db.listRecords({
        collection: COLLECTIONS.EVENT,
        limit: 100,
        cursor,
        filter: { clickerId: rkey },
      });
      for (const r of records) {
        const rec = r.record as { timestamp: string };
        rows.push(rec.timestamp);
      }
      cursor = next;
    } while (cursor);

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') createClicker();
  }
</script>

<svelte:head>
  <title>Clicker</title>
</svelte:head>

<main>
  <header>
    <h1>Clicker</h1>
    <p>Manual event data collection</p>
  </header>

  <section class="create">
    <h2>New Clicker</h2>
    <div class="create-row">
      <input
        type="text"
        bind:value={newName}
        placeholder="Clicker name"
        onkeydown={handleKeydown}
        disabled={creating}
        aria-label="Clicker name"
      />
      <button class="btn-primary" onclick={createClicker} disabled={creating || !newName.trim()}>
        {creating ? 'Creating…' : 'Create'}
      </button>
    </div>
  </section>

  <section class="list">
    <h2>Your Clickers</h2>
    {#if loading}
      <p class="empty">Loading…</p>
    {:else if clickers.length === 0}
      <p class="empty">No clickers yet. Create one above.</p>
    {:else}
      <ul>
        {#each clickers as clicker (clicker.rkey)}
          <li class="card">
            <div class="card-info">
              <span class="card-name">{clicker.name}</span>
              <span class="card-count">{clicker.count} event{clicker.count !== 1 ? 's' : ''}</span>
            </div>
            <div class="card-actions">
              <a class="btn btn-primary" href="{base}/clicker/{clicker.rkey}">Open</a>
              <button class="btn btn-secondary" onclick={() => exportCsv(clicker.rkey, clicker.name)}>
                Export CSV
              </button>
              <button
                class="btn btn-danger"
                onclick={() => {
                  if (confirm(`Delete "${clicker.name}" and all its events?`)) {
                    deleteClicker(clicker.rkey);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  header {
    margin-bottom: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
  }

  header p {
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text);
  }

  section {
    margin-bottom: 2rem;
  }

  .create-row {
    display: flex;
    gap: 0.5rem;
  }

  .create-row input {
    flex: 1;
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: 2rem 0;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card-name {
    font-weight: 600;
    font-size: 1.05rem;
  }

  .card-count {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.9rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius);
    white-space: nowrap;
    text-decoration: none;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-dark);
    text-decoration: none;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--bg);
  }

  .btn-danger {
    background: transparent;
    color: var(--danger);
    border: 1px solid var(--border);
  }

  .btn-danger:hover {
    background: #fef2f2;
    border-color: var(--danger);
  }
</style>
