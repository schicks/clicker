<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { getDb, COLLECTIONS } from '$lib/db';

  const id = $derived($page.params.id);

  let name = $state('');
  let count = $state(0);
  let loading = $state(true);
  let recording = $state(false);
  let lastTimestamp = $state<string | null>(null);

  onMount(async () => {
    const db = await getDb();
    const rec = await db.getRecord({ collection: COLLECTIONS.CLICKER, rkey: id });
    if (rec) {
      const r = rec.record as unknown as { name: string };
      name = r.name;
      count = await db.countRecords(COLLECTIONS.EVENT, { clickerId: id });
    }
    loading = false;
  });

  async function recordEvent() {
    if (recording) return;
    recording = true;
    try {
      const db = await getDb();
      const timestamp = new Date().toISOString();
      await db.createRecord({
        collection: COLLECTIONS.EVENT,
        record: { clickerId: id, timestamp },
      });
      count += 1;
      lastTimestamp = timestamp;
    } finally {
      recording = false;
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString();
  }
</script>

<svelte:head>
  <title>{name || 'Clicker'} — Clicker</title>
</svelte:head>

<main>
  <nav>
    <a href="{base}/" class="back">← All Clickers</a>
  </nav>

  {#if loading}
    <p class="state-msg">Loading…</p>
  {:else if !name}
    <p class="state-msg">Clicker not found. <a href="{base}/">Go back</a></p>
  {:else}
    <div class="screen">
      <h1>{name}</h1>

      <button
        class="record-btn"
        onclick={recordEvent}
        disabled={recording}
        aria-label="Record event"
      >
        <span class="record-label">Click</span>
      </button>

      <div class="stats">
        <span class="count">{count}</span>
        <span class="count-label">event{count !== 1 ? 's' : ''}</span>
      </div>

      {#if lastTimestamp}
        <p class="last">Last recorded at {formatTime(lastTimestamp)}</p>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1rem;
    max-width: 480px;
    margin: 0 auto;
  }

  nav {
    margin-bottom: 1rem;
  }

  .back {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .state-msg {
    text-align: center;
    color: var(--text-muted);
    margin-top: 4rem;
  }

  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
  }

  .record-btn {
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.35);
    transition: background 0.1s, transform 0.1s, box-shadow 0.1s;
  }

  .record-btn:hover:not(:disabled) {
    background: var(--primary-dark);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.45);
  }

  .record-btn:active:not(:disabled) {
    transform: scale(0.94);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  .record-btn:disabled {
    background: var(--primary);
    opacity: 0.7;
  }

  .record-label {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    pointer-events: none;
  }

  .stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .count {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
    color: var(--primary);
  }

  .count-label {
    font-size: 1rem;
    color: var(--text-muted);
  }

  .last {
    font-size: 0.875rem;
    color: var(--text-muted);
  }
</style>
