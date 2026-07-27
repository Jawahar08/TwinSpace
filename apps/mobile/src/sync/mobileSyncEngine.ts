import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Client, type IMessage } from '@stomp/stompjs';
import type { Note, OutboxItem, SyncAckResponse, SyncChangeEvent, SyncMutationRequest, SyncResyncResponse } from '@syncnotes/types';
import { resolveLwwConflict, generateClientMutationId, getOrCreateDeviceId } from '@syncnotes/utils';

const API_BASE = 'http://localhost:8080';
const WS_BASE = 'ws://localhost:8080/ws-sync';

export type SyncState = 'CONNECTED' | 'CONNECTING' | 'OFFLINE' | 'RECONNECTING';

const NOTES_KEY = 'syncnotes_mobile_notes';
const OUTBOX_KEY = 'syncnotes_mobile_outbox';
const CURSOR_KEY = 'syncnotes_mobile_cursor';

export class MobileSyncEngine {
  private stompClient: Client | null = null;
  private token: string | null = null;
  private deviceId: string = 'dev_mobile_iphone';
  private state: SyncState = 'OFFLINE';

  private onStateChangeListeners = new Set<(state: SyncState) => void>();
  private onNotesChangeListeners = new Set<(notes: Note[]) => void>();
  private onRemoteUpdateListeners = new Set<(note: Note) => void>();

  constructor() {
    this.initDeviceId();
  }

  private async initDeviceId() {
    const existing = await SecureStore.getItemAsync('device_id');
    if (existing) {
      this.deviceId = existing;
    } else {
      this.deviceId = 'dev_ios_' + generateClientMutationId();
      await SecureStore.setItemAsync('device_id', this.deviceId);
    }
  }

  public async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await SecureStore.setItemAsync('access_token', token);
      this.connect();
    } else {
      await SecureStore.deleteItemAsync('access_token');
      this.disconnect();
    }
  }

  public async loadStoredToken(): Promise<string | null> {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      this.token = token;
      this.connect();
    }
    return token;
  }

  public subscribeState(listener: (state: SyncState) => void) {
    this.onStateChangeListeners.add(listener);
    listener(this.state);
    return () => this.onStateChangeListeners.delete(listener);
  }

  public subscribeNotes(listener: (notes: Note[]) => void) {
    this.onNotesChangeListeners.add(listener);
    this.getNotes().then(listener);
    return () => this.onNotesChangeListeners.delete(listener);
  }

  public subscribeRemoteUpdate(listener: (note: Note) => void) {
    this.onRemoteUpdateListeners.add(listener);
    return () => this.onRemoteUpdateListeners.delete(listener);
  }

  private setState(newState: SyncState) {
    this.state = newState;
    this.onStateChangeListeners.forEach(l => l(newState));
  }

  public connect() {
    if (!this.token || (this.stompClient && this.stompClient.active)) return;
    this.setState('CONNECTING');

    this.stompClient = new Client({
      brokerURL: WS_BASE,
      connectHeaders: { Authorization: `Bearer ${this.token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.setState('CONNECTED');
        this.subscribeChannels();
        this.performCursorCatchUp();
        this.flushOutbox();
      },
      onDisconnect: () => this.setState('OFFLINE'),
      onStompError: () => this.setState('RECONNECTING'),
      onWebSocketClose: () => this.setState('OFFLINE'),
    });

    this.stompClient.activate();
  }

  public disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.setState('OFFLINE');
  }

  private subscribeChannels() {
    if (!this.stompClient) return;

    this.stompClient.subscribe('/user/queue/sync.events', (msg: IMessage) => {
      try {
        const event: SyncChangeEvent = JSON.parse(msg.body);
        this.handleIncomingChangeEvent(event);
      } catch (err) {
        console.error('Mobile sync event error', err);
      }
    });

    this.stompClient.subscribe('/user/queue/sync.ack', (msg: IMessage) => {
      try {
        const ack: SyncAckResponse = JSON.parse(msg.body);
        this.handleSyncAck(ack);
      } catch (err) {
        console.error('Mobile sync ack error', err);
      }
    });
  }

  private async handleIncomingChangeEvent(event: SyncChangeEvent) {
    if (event.originDeviceId === this.deviceId) return;

    if (event.entityType === 'NOTE') {
      const incomingNote = event.payload as Note;
      const notes = await this.getNotes();
      const idx = notes.findIndex(n => n.id === incomingNote.id);

      if (idx === -1) {
        notes.unshift(incomingNote);
      } else {
        const existing = notes[idx];
        const lww = resolveLwwConflict(
          incomingNote.updatedAt,
          event.originDeviceId,
          existing.updatedAt,
          existing.clientMutationId || ''
        );
        if (lww.clientWins || event.operation === 'DELETE') {
          notes[idx] = incomingNote;
        }
      }

      await this.saveNotes(notes);
      await AsyncStorage.setItem(CURSOR_KEY, String(event.revisionId));
      this.onRemoteUpdateListeners.forEach(l => l(incomingNote));
    }
  }

  private async handleSyncAck(ack: SyncAckResponse) {
    const outbox = await this.getOutbox();
    const filtered = outbox.filter(i => i.mutation.clientMutationId !== ack.clientMutationId);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(filtered));

    if (ack.status === 'CONFLICT_LWW_LOST' && ack.authoritativeNote) {
      const notes = await this.getNotes();
      const idx = notes.findIndex(n => n.id === ack.authoritativeNote!.id);
      if (idx !== -1) {
        notes[idx] = ack.authoritativeNote;
      } else {
        notes.unshift(ack.authoritativeNote);
      }
      await this.saveNotes(notes);
      this.onRemoteUpdateListeners.forEach(l => l(ack.authoritativeNote!));
    }
  }

  public async getNotes(): Promise<Note[]> {
    const str = await AsyncStorage.getItem(NOTES_KEY);
    return str ? JSON.parse(str) : [];
  }

  private async saveNotes(notes: Note[]) {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    this.onNotesChangeListeners.forEach(l => l(notes));
  }

  private async getOutbox(): Promise<OutboxItem[]> {
    const str = await AsyncStorage.getItem(OUTBOX_KEY);
    return str ? JSON.parse(str) : [];
  }

  public async queueMutation(
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: Partial<Note>,
    baseVersion: number = 1
  ): Promise<Note> {
    const nowIso = new Date().toISOString();
    const mutationId = generateClientMutationId();
    const notes = await this.getNotes();
    const existing = notes.find(n => n.id === entityId);

    const noteToSave: Note = {
      id: entityId,
      userId: existing?.userId || '',
      title: payload.title !== undefined ? payload.title : existing?.title || '',
      content: payload.content !== undefined ? payload.content : existing?.content || '',
      pinned: payload.pinned !== undefined ? payload.pinned : existing?.pinned || false,
      archived: payload.archived !== undefined ? payload.archived : existing?.archived || false,
      deleted: operation === 'DELETE' || payload.deleted || false,
      version: existing ? existing.version + 1 : baseVersion,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      deviceId: this.deviceId,
      clientMutationId: mutationId,
    };

    if (existing) {
      const idx = notes.findIndex(n => n.id === entityId);
      notes[idx] = noteToSave;
    } else {
      notes.unshift(noteToSave);
    }
    await this.saveNotes(notes);

    const mutationReq: SyncMutationRequest = {
      clientMutationId: mutationId,
      deviceId: this.deviceId,
      entityType: 'NOTE',
      entityId,
      operation,
      baseVersion,
      payload: {
        id: noteToSave.id,
        title: noteToSave.title,
        content: noteToSave.content,
        pinned: noteToSave.pinned,
        archived: noteToSave.archived,
        deleted: noteToSave.deleted,
        deviceId: this.deviceId,
        clientMutationId: mutationId,
      },
      clientTimestamp: nowIso,
    };

    const outbox = await this.getOutbox();
    outbox.push({
      id: mutationId,
      mutation: mutationReq,
      createdAt: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));

    this.flushOutbox();
    return noteToSave;
  }

  public async flushOutbox() {
    if (!this.stompClient || !this.stompClient.connected) return;
    const outbox = await this.getOutbox();
    for (const item of outbox) {
      this.stompClient.publish({
        destination: '/app/sync.mutate',
        body: JSON.stringify(item.mutation),
      });
    }
  }

  public async performCursorCatchUp() {
    if (!this.token) return;
    try {
      const cursorStr = await AsyncStorage.getItem(CURSOR_KEY);
      const cursor = cursorStr ? parseInt(cursorStr, 10) : 0;
      const res = await fetch(`${API_BASE}/api/sync/changes?cursor=${cursor}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.ok) {
        const data: SyncResyncResponse = await res.json();
        if (data.requiresSnapshot) {
          await this.fetchAndApplyFullSnapshot();
        } else {
          for (const change of data.changes) {
            await this.handleIncomingChangeEvent(change);
          }
          if (data.latestRevision) {
            await AsyncStorage.setItem(CURSOR_KEY, String(data.latestRevision));
          }
        }
      }
    } catch (err) {
      console.error('Mobile cursor catchup error', err);
    }
  }

  public async fetchAndApplyFullSnapshot() {
    if (!this.token) return;
    try {
      const res = await fetch(`${API_BASE}/api/sync/snapshot`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.ok) {
        const data: SyncResyncResponse = await res.json();
        if (data.snapshot) {
          await this.saveNotes(data.snapshot.notes);
          await AsyncStorage.setItem(CURSOR_KEY, String(data.latestRevision));
        }
      }
    } catch (err) {
      console.error('Mobile snapshot error', err);
    }
  }
}

export const mobileSyncEngine = new MobileSyncEngine();
