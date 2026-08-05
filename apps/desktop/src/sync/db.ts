import Dexie, { type Table } from 'dexie';
import type { Note, Attachment, OutboxItem } from '@syncnotes/types';

export interface MetaItem {
  key: string;
  value: any;
}

export class SyncNotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  attachments!: Table<Attachment, string>;
  outbox!: Table<OutboxItem, string>;
  meta!: Table<MetaItem, string>;

  constructor() {
    super('SyncNotesLocalDB');
    this.version(2).stores({
      notes: 'id, userId, updatedAt, [userId+deleted], [userId+archived], pinned',
      attachments: 'id, noteId, userId, createdAt',
      outbox: 'id, createdAt',
      meta: 'key',
    });
  }
}

export const db = new SyncNotesDatabase();
