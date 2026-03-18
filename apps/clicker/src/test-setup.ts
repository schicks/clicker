import { IDBFactory } from 'fake-indexeddb';
import '@testing-library/jest-dom/vitest';
import { _resetDb } from '$lib/db';

beforeEach(() => {
  // Fresh IndexedDB instance — no data leaks between tests.
  global.indexedDB = new IDBFactory();
  _resetDb();
});
