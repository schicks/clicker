import { describe, it, expect, vi } from 'vitest';
import * as atprotoIdb from '@clicker/atproto-idb';
import { getDb, _resetDb } from '$lib/db';

describe('getDb singleton', () => {
  it('returns the same instance on repeated calls', async () => {
    const db1 = await getDb();
    const db2 = await getDb();
    expect(db1).toBe(db2);
  });

  it('retries after a failed initialization instead of caching the rejection', async () => {
    // Simulate a transient DB initialization failure (e.g. storage quota, private
    // browsing mode). Without a fix, dbPromise stays set to the rejected Promise and
    // every future getDb() call throws forever — no recovery without a page reload.
    const original = atprotoIdb.createAtprotoIdb;
    const spy = vi
      .spyOn(atprotoIdb, 'createAtprotoIdb')
      .mockRejectedValueOnce(new Error('IDB unavailable'));

    await expect(getDb()).rejects.toThrow('IDB unavailable');

    // After the failure the singleton must be cleared so the next call tries again.
    spy.mockRestore();
    await expect(getDb()).resolves.toBeDefined();
  });
});
