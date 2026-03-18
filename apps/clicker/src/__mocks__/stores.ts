import { writable } from 'svelte/store';

export const page = writable({
  params: {} as Record<string, string>,
  url: new URL('http://localhost/'),
});
