// User & Authentication Domain Types
export interface User {
  id: string;
  email: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // milliseconds
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Canonical Note Model
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  pinned: boolean;
  archived: boolean;
  deleted: boolean; // Soft-delete tombstone
  version: number;  // Authoritative server incrementing version
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  deviceId?: string;
  clientMutationId?: string;
}

export type NoteInput = Omit<Note, 'userId' | 'version' | 'createdAt' | 'updatedAt'>;

// Attachment Metadata & Upload Session
export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface Attachment {
  id: string;
  noteId: string;
  userId: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  storageKey: string;
  previewMetadata?: string; // JSON string (width, height, thumbnail, etc)
  uploadStatus: UploadStatus;
  deleted: boolean;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  downloadUrl?: string;
}

export interface AttachmentUploadInitRequest {
  noteId: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
}

export interface AttachmentUploadInitResponse {
  attachment: Attachment;
  uploadUrl: string; // Pre-signed or upload session URL
  expiresAt: string;
}

// Realtime Synchronization Protocol Contracts
export type EntityType = 'NOTE' | 'ATTACHMENT';
export type MutationOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncMutationRequest {
  clientMutationId: string;
  deviceId: string;
  entityType: EntityType;
  entityId: string;
  operation: MutationOperation;
  baseVersion: number;
  payload: NoteInput | Partial<NoteInput>;
  clientTimestamp: string; // ISO 8601 UTC
}

export type SyncAckStatus = 'ACK' | 'REJECTED' | 'CONFLICT_LWW_LOST';

export interface SyncAckResponse {
  clientMutationId: string;
  entityId: string;
  serverVersion: number;
  status: SyncAckStatus;
  authoritativeNote?: Note;
  message?: string;
  timestamp: string;
}

export interface SyncChangeEvent {
  revisionId: number;
  entityType: EntityType;
  entityId: string;
  operation: MutationOperation;
  version: number;
  payload: Note | Attachment;
  timestamp: string; // ISO 8601 UTC
  originDeviceId: string;
}

export interface SyncCursorRequest {
  lastAcknowledgedRevision: number;
  limit?: number;
}

export interface SyncResyncResponse {
  requiresSnapshot: boolean;
  latestRevision: number;
  changes: SyncChangeEvent[];
  snapshot?: {
    notes: Note[];
    attachments: Attachment[];
  };
}

// Outbox item structure for offline persistence on clients
export interface OutboxItem {
  id: string; // Unique queue item ID
  mutation: SyncMutationRequest;
  createdAt: number;
  retryCount: number;
}

// Standardized API Error Response
export interface ApiErrorResponse {
  code: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
