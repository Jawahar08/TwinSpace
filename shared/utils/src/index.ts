import { z } from 'zod';
import type { Note, SyncMutationRequest } from '@syncnotes/types';

// Zod Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const syncMutationSchema = z.object({
  clientMutationId: z.string().min(1),
  deviceId: z.string().min(1),
  entityType: z.enum(['NOTE', 'ATTACHMENT']),
  entityId: z.string().uuid(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  baseVersion: z.number().int().nonnegative(),
  payload: z.record(z.unknown()),
  clientTimestamp: z.string().datetime({ offset: true }),
});

export const attachmentUploadInitSchema = z.object({
  noteId: z.string().uuid(),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  byteSize: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
});

// File Attachment Validation Constants & Helpers
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'text/plain', 'text/markdown', 'application/json',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Audio & Video
  'audio/mpeg', 'audio/wav', 'audio/aac', 'video/mp4', 'video/webm'
]);

export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function isValidFileSize(sizeInBytes: number): boolean {
  return sizeInBytes > 0 && sizeInBytes <= MAX_FILE_SIZE_BYTES;
}

// Deterministic Last-Write-Wins (LWW) Conflict Resolution Helper
export interface LwwComparisonResult {
  clientWins: boolean;
  reason: 'CLIENT_NEWER' | 'SERVER_NEWER' | 'TIEBREAKER_CLIENT_WINS' | 'TIEBREAKER_SERVER_WINS';
}

/**
 * Compares an incoming client mutation timestamp with the existing entity timestamp.
 * Uses ISO-8601 UTC string parsing and falls back to deterministic clientMutationId tiebreaker.
 */
export function resolveLwwConflict(
  clientTimestampIso: string,
  clientMutationId: string,
  serverTimestampIso: string,
  serverLastMutationId: string = ''
): LwwComparisonResult {
  const clientMs = new Date(clientTimestampIso).getTime();
  const serverMs = new Date(serverTimestampIso).getTime();

  if (clientMs > serverMs) {
    return { clientWins: true, reason: 'CLIENT_NEWER' };
  } else if (serverMs > clientMs) {
    return { clientWins: false, reason: 'SERVER_NEWER' };
  } else {
    // Exact tie on timestamp -> compare mutation IDs deterministically
    if (clientMutationId >= serverLastMutationId) {
      return { clientWins: true, reason: 'TIEBREAKER_CLIENT_WINS' };
    } else {
      return { clientWins: false, reason: 'TIEBREAKER_SERVER_WINS' };
    }
  }
}

// Client mutation ID generator
export function generateClientMutationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

// Device ID helper
export function getOrCreateDeviceId(storageKey: string = 'syncnotes_device_id', getStorage?: () => string | null, setStorage?: (val: string) => void): string {
  if (getStorage) {
    const existing = getStorage();
    if (existing) return existing;
  }
  const newDeviceId = 'dev_' + generateClientMutationId();
  if (setStorage) {
    setStorage(newDeviceId);
  }
  return newDeviceId;
}

// Readable device name helper ("Windows", "iPhone", or "Device")
export function getReadableDeviceName(deviceId?: string): 'Windows' | 'iPhone' | 'Device' {
  if (!deviceId) return 'Device';
  const lower = deviceId.toLowerCase();
  if (lower.includes('iphone') || lower.includes('ios') || lower.includes('mobile')) {
    return 'iPhone';
  }
  if (lower.includes('win') || lower.includes('desktop') || lower.includes('pc')) {
    return 'Windows';
  }
  return 'Device';
}

// Byte formatting helper
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Reading stats helper (word count & estimated reading time)
export function calculateReadingStats(contentHtmlOrText: string): { wordCount: number; charCount: number; readingTimeMinutes: number } {
  const cleanText = contentHtmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText ? cleanText.split(' ').filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = cleanText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, charCount, readingTimeMinutes };
}

// Auto title extraction from content without overwriting explicit titles
export function extractAutoTitle(contentHtmlOrText: string, currentTitle: string): string {
  if (currentTitle && currentTitle.trim() !== 'Untitled Note' && currentTitle.trim() !== '') {
    return currentTitle;
  }
  const cleanText = contentHtmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanText) return 'Untitled Note';
  const firstLine = cleanText.slice(0, 50).trim();
  return firstLine || 'Untitled Note';
}

// Theme System Types & Single Source of Truth Utility
export type ThemeMode = 'dark' | 'light' | 'system';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const savedTwin = localStorage.getItem('twinspace_theme');
  if (savedTwin === 'light' || savedTwin === 'dark' || savedTwin === 'system') {
    return savedTwin;
  }
  // Clear any legacy keys that might force light mode
  localStorage.removeItem('syncnotes_theme');
  localStorage.setItem('twinspace_theme', 'dark');
  return 'dark';
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('twinspace_theme', mode);
  }
}

export function applyTheme(mode: ThemeMode): 'dark' | 'light' {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'dark';
  
  let effective: 'dark' | 'light' = 'dark';
  if (mode === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    effective = systemPrefersDark ? 'dark' : 'light';
  } else {
    effective = mode;
  }

  const root = document.documentElement;
  const body = document.body;

  root.setAttribute('data-theme', effective);
  if (body) body.setAttribute('data-theme', effective);

  if (effective === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    if (body) {
      body.classList.add('dark');
      body.classList.remove('light');
    }
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
    }
  }

  return effective;
}
