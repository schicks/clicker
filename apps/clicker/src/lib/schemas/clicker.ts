import type { LexiconDoc } from '@clicker/atproto-idb';

export const clickerSchema: LexiconDoc = {
  lexicon: 1,
  id: 'app.clicker.clicker',
  defs: {
    main: {
      type: 'record',
      record: {
        type: 'object',
        required: ['name', 'createdAt'],
        properties: {
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'datetime' },
        },
      },
    },
  },
};
