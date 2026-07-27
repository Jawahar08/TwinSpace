# SyncNotes

SyncNotes is a private, minimal, lightning-fast personal notes application with real-time WebSocket synchronization between Windows desktop and iPhone clients.

---

## Architecture Overview

```text
                               ┌───────────────────────────┐
                               │     Windows Desktop       │
                               │ Electron + React 19 + TS  │
                               │ IndexedDB (Dexie) Outbox │
                               └─────────────┬─────────────┘
                                             │
                                  STOMP / WebSockets / REST
                                             │
┌───────────────────────────┐                ▼                ┌───────────────────────────┐
│     iPhone Mobile App     │ ───────────────┼──────────────> │     Spring Boot 3 API     │
│  React Native + Expo + TS │                │                │  Java 17/23 + Security    │
│    AsyncStorage Outbox    │                │                │  Flyway + Storage Service │
└───────────────────────────┘                │                └─────────────┬─────────────┘
                                             │                              │
                                             └──────────────┬───────────────┘
                                                            │
                                                            ▼
                                              ┌───────────────────────────┐
                                              │    PostgreSQL Database    │
                                              │ Notes, Auth, Sync Logs    │
                                              └───────────────────────────┘
```

### Data Flow & Synchronization

```text
[Client Keystroke] ──> [Optimistic Local Write] ──> [Enqueues Outbox Mutation]
                                                            │
                                                     STOMP / WSS Push
                                                            │
                                                            ▼
[Server STOMP Endpoint] ──> [Idempotency & LWW Check] ──> [Persist & Increment Version]
                                                            │
                                                  Broadcast STOMP Event
                                                            │
                                                            ▼
                                              [Remote Connected Clients Update]
```

---

## Key Features

- **Apple Notes-Style Interface**: Clean typography, generous whitespace, dark/light themes, and no manual Save button.
- **Realtime STOMP Sync**: Keystrokes update local cache instantly and sync across connected devices over WebSockets.
- **Offline-First & Outbox Queue**: Offline edits survive application restarts and auto-retry upon reconnection.
- **Deterministic Conflict Resolution**: Last-Write-Wins (LWW) timestamp comparison with deterministic tiebreakers.
- **Soft Deletes & Tombstones**: Deleted notes propagate correctly across offline and online devices.
- **Attachment Support**: PDF, image, document, archive, audio, and video attachments with file type and size validation.
- **Secure Credentials**: Windows Credential Manager (`safeStorage`) for Desktop and iOS Keychain (`SecureStore`) for Mobile.

---

## Repository Structure

```text
NoteSync/
├── apps/
│   ├── desktop/             # Windows Electron + React 19 + Vite + Tailwind + Tiptap
│   └── mobile/              # iPhone React Native + Expo + TypeScript
├── backend/
│   └── springboot-api/      # Java 17+ Spring Boot 3 REST & STOMP WebSocket API
├── shared/
│   ├── types/               # Shared TypeScript domain & sync protocol contracts
│   └── utils/               # Shared validation schemas & LWW comparison logic
├── docs/
│   ├── DEPLOYMENT.md        # Local setup, Docker, and build packaging instructions
│   └── TROUBLESHOOTING.md   # Operational runbook & diagnostics
├── docker-compose.yml       # Local PostgreSQL database environment
└── package.json             # Monorepo npm workspaces setup
```

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v20+
- **Java**: 17 or higher
- **Maven**: 3.9+
- **Docker**: For running PostgreSQL locally

### 2. Database Setup
Start PostgreSQL 16 container:
```bash
docker compose up -d
```

### 3. Backend Setup
Run Flyway database migrations and start Spring Boot API:
```bash
cd backend/springboot-api
mvn spring-boot:run
```
*API runs at `http://localhost:8080` with STOMP WebSocket endpoint at `/ws-sync`.*

### 4. Shared Packages & Desktop Setup
Build shared TypeScript contracts and run Desktop client:
```bash
# Build shared workspace dependencies
npm run build:shared

# Run Electron Desktop in development mode
npm run dev --workspace=apps/desktop
```

### 5. Mobile App Setup
Run Expo React Native development server:
```bash
npm run start --workspace=apps/mobile
```

---

## Testing & Build

- **Backend Tests**: `cd backend/springboot-api && mvn test`
- **Desktop Build**: `npm run build --workspace=apps/desktop`
- **Mobile Typecheck**: `npm run typecheck --workspace=apps/mobile`

---

## License

Private & Proprietary.
