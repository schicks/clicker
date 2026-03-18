import 'fake-indexeddb/auto'; // polyfills IDBRequest, IDBDatabase, IDBFactory, etc. on globalThis
import '@testing-library/jest-dom/vitest';
import { IDBFactory } from 'fake-indexeddb';
import { _resetDb } from '$lib/db';

beforeEach(() => {
  // Fresh IndexedDB per test — all other IDB class globals remain from the /auto import above.
  globalThis.indexedDB = new IDBFactory();
  _resetDb();
});
