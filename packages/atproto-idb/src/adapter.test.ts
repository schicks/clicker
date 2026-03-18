import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createAtprotoIdb } from './adapter.js';
import type { AtprotoIdb, LexiconDoc } from './types.js';

const schema: LexiconDoc = {
  lexicon: 1,
  id: 'test.col',
  defs: {
    main: {
      type: 'record',
      record: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
  },
};

const otherSchema: LexiconDoc = {
  lexicon: 1,
  id: 'test.other',
  defs: {
    main: {
      type: 'record',
      record: { type: 'object', properties: { val: { type: 'string' } } },
    },
  },
};

// Each test gets a fresh IndexedDB so state never leaks between tests.
let db: AtprotoIdb;
beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory();
  db = await createAtprotoIdb({ schemas: [schema, otherSchema], dbName: 'test' });
});

describe('createRecord', () => {
  it('returns a record with a generated rkey', async () => {
    const rec = await db.createRecord({ collection: 'test.col', record: { name: 'hello' } });
    expect(rec.rkey).toBeTruthy();
    expect(rec.indexedAt).toBeTruthy();
  });

  it('accepts a caller-supplied rkey', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'x' }, rkey: 'my-key' });
    const fetched = await db.getRecord({ collection: 'test.col', rkey: 'my-key' });
    expect(fetched).toBeDefined();
  });

  it('stamps $type onto the stored record', async () => {
    const rec = await db.createRecord({ collection: 'test.col', record: { name: 'x' } });
    expect(rec.record.$type).toBe('test.col');
  });

  it('rejects unknown collections', async () => {
    await expect(
      db.createRecord({ collection: 'unknown.collection', record: {} })
    ).rejects.toThrow('Unknown collection');
  });
});

describe('getRecord', () => {
  it('retrieves a record that was written', async () => {
    const created = await db.createRecord({ collection: 'test.col', record: { name: 'hi' } });
    const fetched = await db.getRecord({ collection: 'test.col', rkey: created.rkey });
    expect(fetched).toBeDefined();
    expect(fetched?.record.name).toBe('hi');
  });

  it('returns undefined for a non-existent rkey', async () => {
    const result = await db.getRecord({ collection: 'test.col', rkey: 'ghost' });
    expect(result).toBeUndefined();
  });
});

describe('listRecords', () => {
  it('records are listable after being written', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'a' } });
    await db.createRecord({ collection: 'test.col', record: { name: 'b' } });
    const { records } = await db.listRecords({ collection: 'test.col' });
    expect(records).toHaveLength(2);
  });

  it('records are not listable after being deleted', async () => {
    const rec = await db.createRecord({ collection: 'test.col', record: { name: 'gone' } });
    await db.deleteRecord({ collection: 'test.col', rkey: rec.rkey });
    const { records } = await db.listRecords({ collection: 'test.col' });
    expect(records).toHaveLength(0);
  });

  it('does not return records from other collections', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'a' } });
    await db.createRecord({ collection: 'test.other', record: { val: 'b' } });
    const { records } = await db.listRecords({ collection: 'test.col' });
    expect(records).toHaveLength(1);
    expect(records[0].record.$type).toBe('test.col');
  });

  it('filters by a field value', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'match' } });
    await db.createRecord({ collection: 'test.col', record: { name: 'other' } });
    const { records } = await db.listRecords({ collection: 'test.col', filter: { name: 'match' } });
    expect(records).toHaveLength(1);
    expect(records[0].record.name).toBe('match');
  });

  it('paginates with cursor — pages are non-overlapping and exhaustive', async () => {
    for (let i = 0; i < 5; i++) {
      await db.createRecord({ collection: 'test.col', record: { name: `item-${i}` } });
    }
    const page1 = await db.listRecords({ collection: 'test.col', limit: 3 });
    expect(page1.records).toHaveLength(3);
    expect(page1.cursor).toBeDefined();

    const page2 = await db.listRecords({ collection: 'test.col', limit: 3, cursor: page1.cursor });
    expect(page2.records).toHaveLength(2);
    expect(page2.cursor).toBeUndefined();

    const allRkeys = [...page1.records, ...page2.records].map((r) => r.rkey);
    expect(new Set(allRkeys).size).toBe(5);
  });

  it('returns empty list and no cursor when there are no records', async () => {
    const { records, cursor } = await db.listRecords({ collection: 'test.col' });
    expect(records).toHaveLength(0);
    expect(cursor).toBeUndefined();
  });
});

describe('deleteRecord', () => {
  it('deleted record is not returned by getRecord', async () => {
    const rec = await db.createRecord({ collection: 'test.col', record: { name: 'bye' } });
    await db.deleteRecord({ collection: 'test.col', rkey: rec.rkey });
    expect(await db.getRecord({ collection: 'test.col', rkey: rec.rkey })).toBeUndefined();
  });

  it('is a no-op for a non-existent rkey', async () => {
    await expect(
      db.deleteRecord({ collection: 'test.col', rkey: 'does-not-exist' })
    ).resolves.not.toThrow();
  });
});

describe('countRecords', () => {
  it('returns 0 for an empty collection', async () => {
    expect(await db.countRecords('test.col')).toBe(0);
  });

  it('increments after each create', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'a' } });
    expect(await db.countRecords('test.col')).toBe(1);
    await db.createRecord({ collection: 'test.col', record: { name: 'b' } });
    expect(await db.countRecords('test.col')).toBe(2);
  });

  it('decrements after delete', async () => {
    const rec = await db.createRecord({ collection: 'test.col', record: { name: 'a' } });
    await db.deleteRecord({ collection: 'test.col', rkey: rec.rkey });
    expect(await db.countRecords('test.col')).toBe(0);
  });

  it('counts only records matching the filter', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'match' } });
    await db.createRecord({ collection: 'test.col', record: { name: 'match' } });
    await db.createRecord({ collection: 'test.col', record: { name: 'other' } });
    expect(await db.countRecords('test.col', { name: 'match' })).toBe(2);
    expect(await db.countRecords('test.col', { name: 'other' })).toBe(1);
    expect(await db.countRecords('test.col', { name: 'none' })).toBe(0);
  });

  it('does not count records from other collections', async () => {
    await db.createRecord({ collection: 'test.col', record: { name: 'a' } });
    await db.createRecord({ collection: 'test.other', record: { val: 'b' } });
    expect(await db.countRecords('test.col')).toBe(1);
  });
});
