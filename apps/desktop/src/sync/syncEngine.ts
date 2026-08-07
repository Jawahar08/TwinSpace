import { Client, type IMessage } from '@stomp/stompjs';
import type { Note, SyncAckResponse, SyncChangeEvent, SyncMutationRequest, SyncResyncResponse, DeviceActivity } from '@syncnotes/types';
import { resolveLwwConflict, generateClientMutationId, getOrCreateDeviceId, getReadableDeviceName } from '@syncnotes/utils';
import { db } from './db';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'https://twinspace.onrender.com';
const WS_BASE = (import.meta.env.VITE_WS_BASE_URL as string) || 'wss://twinspace.onrender.com/ws-sync';

export type SyncState = 'CONNECTED' | 'CONNECTING' | 'OFFLINE' | 'RECONNECTING' | 'SYNCING' | 'ERROR';

export interface TwinSpaceMetrics {
  state: SyncState;
  latencyMs: number;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastRemoteDevice: 'Windows' | 'iPhone' | 'Device';
  windowsNodeState: 'ONLINE' | 'SYNCING' | 'OFFLINE';
  iphoneNodeState: 'ONLINE' | 'SYNCING' | 'OFFLINE';
}

export class SyncEngine {
  private stompClient: Client | null = null;
  private token: string | null = null;
  private deviceId: string;
  private isProcessingOutbox = false;
  private state: SyncState = 'OFFLINE';
  private latencyMs: number = 24;
  private pendingCount: number = 0;
  private lastSyncedAt: string | null = new Date().toISOString();
  private lastRemoteDevice: 'Windows' | 'iPhone' | 'Device' = 'iPhone';

  private onStateChangeListeners = new Set<(state: SyncState) => void>();
  private onRemoteUpdateListeners = new Set<(note: Note, originDeviceType: 'Windows' | 'iPhone' | 'Device') => void>();
  private onDeviceActivityListeners = new Set<(activities: DeviceActivity[]) => void>();
  private onMetricsListeners = new Set<(metrics: TwinSpaceMetrics) => void>();
  private recentActivities: DeviceActivity[] = [];

  constructor() {
    this.deviceId = getOrCreateDeviceId('syncnotes_desktop_dev_id',
      () => localStorage.getItem('syncnotes_device_id'),
      (id) => localStorage.setItem('syncnotes_device_id', id)
    );
    this.updatePendingCount();
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      this.connect();
    } else {
      this.disconnect();
    }
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public subscribeState(listener: (state: SyncState) => void) {
    this.onStateChangeListeners.add(listener);
    listener(this.state);
    return () => this.onStateChangeListeners.delete(listener);
  }

  public subscribeRemoteUpdate(listener: (note: Note, originDeviceType: 'Windows' | 'iPhone' | 'Device') => void) {
    this.onRemoteUpdateListeners.add(listener);
    return () => this.onRemoteUpdateListeners.delete(listener);
  }

  public subscribeDeviceActivity(listener: (activities: DeviceActivity[]) => void) {
    this.onDeviceActivityListeners.add(listener);
    listener(this.recentActivities);
    return () => this.onDeviceActivityListeners.delete(listener);
  }

  public subscribeMetrics(listener: (metrics: TwinSpaceMetrics) => void) {
    this.onMetricsListeners.add(listener);
    listener(this.getMetrics());
    return () => this.onMetricsListeners.delete(listener);
  }

  public getMetrics(): TwinSpaceMetrics {
    const isWindowsSelf = getReadableDeviceName(this.deviceId) === 'Windows';
    return {
      state: this.state,
      latencyMs: this.latencyMs,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastRemoteDevice: this.lastRemoteDevice,
      windowsNodeState: isWindowsSelf
        ? (this.state === 'CONNECTED' ? 'ONLINE' : this.state === 'SYNCING' ? 'SYNCING' : 'OFFLINE')
        : (this.state === 'CONNECTED' ? 'ONLINE' : 'OFFLINE'),
      iphoneNodeState: !isWindowsSelf
        ? (this.state === 'CONNECTED' ? 'ONLINE' : this.state === 'SYNCING' ? 'SYNCING' : 'OFFLINE')
        : (this.state === 'CONNECTED' ? 'ONLINE' : 'OFFLINE'),
    };
  }

  private emitMetrics() {
    const m = this.getMetrics();
    this.onMetricsListeners.forEach((l) => l(m));
  }

  private async updatePendingCount() {
    try {
      this.pendingCount = await db.outbox.count();
      this.emitMetrics();
    } catch (e) {}
  }

  private setState(newState: SyncState) {
    this.state = newState;
    this.onStateChangeListeners.forEach((l) => l(newState));
    this.emitMetrics();
  }

  public connect() {
    if (!this.token) return;
    if (this.stompClient && this.stompClient.active) return;

    this.setState('CONNECTING');

    this.stompClient = new Client({
      brokerURL: WS_BASE,
      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.setState('CONNECTED');
        this.lastSyncedAt = new Date().toISOString();
        this.subscribeChannels();
        this.performCursorCatchUp();
        this.flushOutbox();
      },
      onDisconnect: () => {
        this.setState('OFFLINE');
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
        this.setState('RECONNECTING');
      },
      onWebSocketClose: () => {
        this.setState('OFFLINE');
      },
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

    // Subscribe to user-scoped realtime change events
    this.stompClient.subscribe('/user/queue/sync.events', (msg: IMessage) => {
      try {
        const event: SyncChangeEvent = JSON.parse(msg.body);
        this.handleIncomingChangeEvent(event);
      } catch (err) {
        console.error('Failed parsing sync event', err);
      }
    });

    // Subscribe to mutation acknowledgements
    this.stompClient.subscribe('/user/queue/sync.ack', (msg: IMessage) => {
      try {
        const ack: SyncAckResponse = JSON.parse(msg.body);
        this.handleSyncAck(ack);
      } catch (err) {
        console.error('Failed parsing sync ack', err);
      }
    });
  }

  private async handleIncomingChangeEvent(event: SyncChangeEvent) {
    if (event.originDeviceId === this.deviceId) {
      return;
    }

    if (event.entityType === 'NOTE') {
      const incomingNote = event.payload as Note;
      const existing = await db.notes.get(incomingNote.id);
      const originDeviceType = getReadableDeviceName(event.originDeviceId);

      this.lastRemoteDevice = originDeviceType;
      this.lastSyncedAt = new Date().toISOString();

      if (!existing) {
        await db.notes.put(incomingNote);
        this.notifyRemoteUpdate(incomingNote, originDeviceType, event.operation, event.originDeviceId);
      } else {
        const lww = resolveLwwConflict(
          incomingNote.updatedAt,
          event.originDeviceId,
          existing.updatedAt,
          existing.clientMutationId || ''
        );

        if (lww.clientWins || event.operation === 'DELETE') {
          await db.notes.put(incomingNote);
          this.notifyRemoteUpdate(incomingNote, originDeviceType, event.operation, event.originDeviceId);
        }
      }

      await db.meta.put({ key: 'last_revision', value: event.revisionId });
    }
  }

  private async handleSyncAck(ack: SyncAckResponse) {
    await db.outbox.where('mutation.clientMutationId').equals(ack.clientMutationId).delete();
    await this.updatePendingCount();

    if (ack.status === 'CONFLICT_LWW_LOST' && ack.authoritativeNote) {
      await db.notes.put(ack.authoritativeNote);
      this.notifyRemoteUpdate(ack.authoritativeNote, 'Device', 'UPDATE', 'server');
    }
  }

  private notifyRemoteUpdate(
    note: Note,
    originDeviceType: 'Windows' | 'iPhone' | 'Device' = 'Device',
    operation: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE',
    originDeviceId: string = ''
  ) {
    this.onRemoteUpdateListeners.forEach((l) => l(note, originDeviceType));

    const activity: DeviceActivity = {
      id: generateClientMutationId(),
      noteId: note.id,
      noteTitle: note.title || 'Untitled Note',
      deviceId: originDeviceId || originDeviceType,
      deviceType: originDeviceType,
      operation,
      timestamp: new Date().toISOString(),
    };

    this.recentActivities = [activity, ...this.recentActivities.slice(0, 19)];
    this.onDeviceActivityListeners.forEach((l) => l(this.recentActivities));
    this.emitMetrics();
  }

  public async trackLocalChange(
    entityType: 'NOTE' | 'ATTACHMENT',
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any,
    baseVersion: number = 0
  ) {
    const mutation: SyncMutationRequest = {
      clientMutationId: generateClientMutationId(),
      deviceId: this.deviceId,
      entityType,
      entityId,
      operation,
      baseVersion,
      payload,
      clientTimestamp: new Date().toISOString(),
    };

    await db.outbox.add({
      id: generateClientMutationId(),
      mutation,
      createdAt: Date.now(),
      retryCount: 0,
    });
    await this.updatePendingCount();

    if (this.state === 'CONNECTED') {
      this.flushOutbox();
    }
  }

  public async flushOutbox() {
    if (this.isProcessingOutbox) return;
    this.isProcessingOutbox = true;

    try {
      const queued = await db.outbox.toArray();
      if (queued.length === 0) {
        this.isProcessingOutbox = false;
        return;
      }

      this.setState('SYNCING');

      for (const item of queued) {
        if (this.stompClient && this.stompClient.connected) {
          this.stompClient.publish({
            destination: '/app/sync.mutate',
            body: JSON.stringify(item.mutation),
          });
        } else {
          await this.sendHttpMutation(item.mutation);
        }
      }

      await this.updatePendingCount();
      this.setState('CONNECTED');
      this.lastSyncedAt = new Date().toISOString();
    } catch (err) {
      console.error('Outbox flush error', err);
      this.setState('OFFLINE');
    } finally {
      this.isProcessingOutbox = false;
    }
  }

  private async sendHttpMutation(mutation: SyncMutationRequest) {
    if (!this.token) return;
    const res = await fetch(`${API_BASE}/api/sync/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(mutation),
    });

    if (res.ok) {
      const ack: SyncAckResponse = await res.json();
      await this.handleSyncAck(ack);
    }
  }

  private async performCursorCatchUp() {
    if (!this.token) return;
    try {
      const meta = await db.meta.get('last_revision');
      const sinceRevision = (meta?.value as number) || 0;

      const res = await fetch(`${API_BASE}/api/sync/resync?sinceRevision=${sinceRevision}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.ok) {
        const data: SyncResyncResponse = await res.json();
        if (data.notes) {
          for (const note of data.notes) {
            await db.notes.put(note);
          }
        } else if (data.changes) {
          for (const change of data.changes) {
            if (change.entityType === 'NOTE') {
              await db.notes.put(change.payload as Note);
            }
          }
        }
        await db.meta.put({ key: 'last_revision', value: data.latestRevision });
        this.lastSyncedAt = new Date().toISOString();
        this.emitMetrics();
      }
    } catch (err) {
      console.error('Resync catch-up error', err);
    }
  }
}

export const syncEngine = new SyncEngine();
