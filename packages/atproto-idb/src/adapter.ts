import { openDB } from 'idb';
import type {
  LexiconDoc,
  AtprotoIdb,
  StoredRecord,
  CreateRecordInput,
  GetRecordInput,
  ListRecordsInput,
  ListRecordsOutput,
  DeleteRecordInput,
} from './types.js';

interface RecordEntry {
  id: string; // `${collection}/${rkey}`
  collection: string;
  rkey: string;
  record: Record<string, unknown>;
  indexedAt: string;
}

const STORE = 'records';

export async function createAtprotoIdb(options: {
  schemas: LexiconDoc[];
  dbName?: string;
}): Promise<AtprotoIdb> {
  const { schemas, dbName = 'atproto-idb' } = options;
  const collections = new Set(schemas.map((s) => s.id));

  const db = await openDB(dbName, 1, {
    upgrade(database) {
      const store = database.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('by-collection', 'collection');
    },
  });

  function assertCollection(collection: string): void {
    if (!collections.has(collection)) {
      throw new Error(`Unknown collection: ${collection}. Register a schema first.`);
    }
  }

  function matchesFilter(record: Record<string, unknown>, filter: Record<string, unknown>): boolean {
    return Object.entries(filter).every(([k, v]) => record[k] === v);
  }

  function toStored(entry: RecordEntry): StoredRecord {
    return { rkey: entry.rkey, record: entry.record as StoredRecord['record'], indexedAt: entry.indexedAt };
  }

  return {
    async createRecord({ collection, record, rkey }: CreateRecordInput): Promise<StoredRecord> {
      assertCollection(collection);
      const key = rkey ?? crypto.randomUUID();
      const indexedAt = new Date().toISOString();
      const entry: RecordEntry = {
        id: `${collection}/${key}`,
        collection,
        rkey: key,
        record: { ...record, $type: collection },
        indexedAt,
      };
      await db.put(STORE, entry);
      return toStored(entry);
    },

    async getRecord({ collection, rkey }: GetRecordInput): Promise<StoredRecord | undefined> {
      assertCollection(collection);
      const entry = await db.get(STORE, `${collection}/${rkey}`);
      return entry ? toStored(entry as RecordEntry) : undefined;
    },

    async listRecords({ collection, limit = 50, cursor, filter }: ListRecordsInput): Promise<ListRecordsOutput> {
      assertCollection(collection);
      const index = db.transaction(STORE, 'readonly').store.index('by-collection');
      const all = (await index.getAll(collection)) as RecordEntry[];

      // Sort by indexedAt descending (newest first)
      all.sort((a, b) => b.indexedAt.localeCompare(a.indexedAt));

      let entries = filter ? all.filter((e) => matchesFilter(e.record, filter)) : all;

      if (cursor) {
        const cursorIdx = entries.findIndex((e) => e.rkey === cursor);
        entries = cursorIdx >= 0 ? entries.slice(cursorIdx + 1) : entries;
      }

      const page = entries.slice(0, limit);
      const nextCursor = page.length === limit ? page[page.length - 1].rkey : undefined;

      return { records: page.map(toStored), cursor: nextCursor };
    },

    async deleteRecord({ collection, rkey }: DeleteRecordInput): Promise<void> {
      assertCollection(collection);
      await db.delete(STORE, `${collection}/${rkey}`);
    },

    async countRecords(collection: string, filter?: Record<string, unknown>): Promise<number> {
      assertCollection(collection);
      if (!filter) {
        const index = db.transaction(STORE, 'readonly').store.index('by-collection');
        return index.count(collection);
      }
      const index = db.transaction(STORE, 'readonly').store.index('by-collection');
      const all = (await index.getAll(collection)) as RecordEntry[];
      return all.filter((e) => matchesFilter(e.record, filter)).length;
    },

    close() {
      db.close();
    },
  };
}
