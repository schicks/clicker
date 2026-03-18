import type { LexiconDoc } from '@clicker/atproto-idb';

export const eventSchema: LexiconDoc = {
  lexicon: 1,
  id: 'app.clicker.event',
  defs: {
    main: {
      type: 'record',
      record: {
        type: 'object',
        required: ['clickerId', 'timestamp'],
        properties: {
          clickerId: { type: 'string' },
          timestamp: { type: 'string', format: 'datetime' },
        },
      },
    },
  },
};
