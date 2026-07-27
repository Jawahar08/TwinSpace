import Dexie, { type Table } from 'dexie';
import type { Note, OutboxItem } from '@syncnotes/types';

export interface MetaItem {
  key: string;
  value: any;
}

export class SyncNotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  outbox!: Table<OutboxItem, string>;
  meta!: Table<MetaItem, string>;

  constructor() {
    super('SyncNotesLocalDB');
    this.version(1).stores({
      notes: 'id, userId, updatedAt, [userId+deleted], [userId+archived], pinned',
      outbox: 'id, createdAt',
      meta: 'key',
    });
  }
}

export const db = new SyncNotesDatabase();
