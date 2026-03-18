import { createAtprotoIdb, type AtprotoIdb } from '@clicker/atproto-idb';
import { clickerSchema } from './schemas/clicker.js';
import { eventSchema } from './schemas/event.js';

export const COLLECTIONS = {
  CLICKER: 'app.clicker.clicker',
  EVENT: 'app.clicker.event',
} as const;

let dbPromise: Promise<AtprotoIdb> | null = null;

export function getDb(): Promise<AtprotoIdb> {
  if (!dbPromise) {
    dbPromise = createAtprotoIdb({
      schemas: [clickerSchema, eventSchema],
      dbName: 'clicker-app',
    });
  }
  return dbPromise;
}

export interface ClickerRecord {
  rkey: string;
  name: string;
  createdAt: string;
  count: number;
}
