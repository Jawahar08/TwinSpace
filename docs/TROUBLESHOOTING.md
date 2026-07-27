# SyncNotes — Troubleshooting Runbook

This document provides operational diagnostic procedures for common runtime issues in SyncNotes.

## 1. WebSocket / STOMP Connection Failures

**Symptom**: Desktop or Mobile client displays "Offline" status badge and STOMP events do not transmit.

**Diagnostics**:
1. Check backend status at `http://localhost:8080/api/auth/me` with a valid JWT token.
2. Verify token validity: STOMP handshake requires `Authorization: Bearer <token>` in connect headers. Expired JWT access tokens will reject the WebSocket connection.
3. Verify CORS and origin pattern settings in `WebSocketConfig.java`.
4. Inspect STOMP destination: Ensure client subscribes to `/user/queue/sync.events`. Subscribing to unauthorized paths will trigger security exceptions.

---

## 2. Real-time Conflict Resolution & LWW Drift

**Symptom**: Local edits do not overwrite remote edits or conflict badge appears.

**Diagnostics**:
1. SyncNotes uses Last-Write-Wins (LWW) based on UTC timestamps.
2. Verify device system clocks are synchronized to UTC.
3. If an incoming mutation timestamp is older than the server's authoritative timestamp, the server responds with `CONFLICT_LWW_LOST` and returns the authoritative note state to reconcile the local cache visibly without losing data.

---

## 3. Offline Outbox Stasis

**Symptom**: Offline mutations do not flush upon reconnecting.

**Diagnostics**:
1. Check Dexie IndexedDB `outbox` table on Desktop or AsyncStorage `syncnotes_mobile_outbox` on iPhone.
2. Ensure device has active network connectivity.
3. Outbox items are enqueued with unique `clientMutationId` and `deviceId`. Retry does not produce duplicate notes or duplicate attachments thanks to server idempotency checks on `(user_id, device_id, client_mutation_id)`.

---

## 4. Attachment Upload Failures

**Symptom**: Attachment upload status remains `FAILED` or throws 400 Bad Request.

**Diagnostics**:
1. Max allowed file size is 50MB.
2. Allowed MIME types: images (`jpeg`, `png`, `gif`, `webp`, `svg`), documents (`pdf`, `zip`, `txt`, `md`, `docx`), audio/video (`mp3`, `wav`, `mp4`, `webm`).
3. Unrecognized or dangerous file extensions will be rejected by `AttachmentService`.
