export interface LexiconProp {
  type: 'string' | 'integer' | 'boolean' | 'array';
  format?: string;
  items?: LexiconProp;
}

export interface LexiconDoc {
  lexicon: 1;
  id: string;
  defs: {
    main: {
      type: 'record';
      record: {
        type: 'object';
        required?: string[];
        properties: Record<string, LexiconProp>;
      };
    };
  };
}

export interface AtRecord {
  $type: string;
  [key: string]: unknown;
}

export interface StoredRecord {
  rkey: string;
  record: AtRecord;
  indexedAt: string;
}

export interface CreateRecordInput {
  collection: string;
  record: Record<string, unknown>;
  rkey?: string;
}

export interface GetRecordInput {
  collection: string;
  rkey: string;
}

export interface ListRecordsInput {
  collection: string;
  limit?: number;
  cursor?: string;
  filter?: Record<string, unknown>;
}

export interface ListRecordsOutput {
  records: StoredRecord[];
  cursor?: string;
}

export interface DeleteRecordInput {
  collection: string;
  rkey: string;
}

export interface AtprotoIdb {
  createRecord(input: CreateRecordInput): Promise<StoredRecord>;
  getRecord(input: GetRecordInput): Promise<StoredRecord | undefined>;
  listRecords(input: ListRecordsInput): Promise<ListRecordsOutput>;
  deleteRecord(input: DeleteRecordInput): Promise<void>;
  countRecords(collection: string, filter?: Record<string, unknown>): Promise<number>;
  close(): void;
}
