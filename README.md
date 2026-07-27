# SyncNotes Antigravity Prompt Pack

This prompt pack is organized into five folders. Use `00-master/MASTER_PROMPT.md` first, then run the implementation prompts in order:

1. `01-foundation-backend/FOUNDATION_BACKEND_PROMPT.md`
2. `02-desktop/DESKTOP_PROMPT.md`
3. `03-mobile/MOBILE_PROMPT.md`
4. `04-quality-release/QUALITY_RELEASE_PROMPT.md`

Each prompt is written for an autonomous coding agent. It tells the agent to inspect the existing repository before editing, preserve working code, implement incrementally, run verification, and report blockers with evidence.

## Product decisions already included

- Single-user private notes app with email/password authentication.
- Electron + React 19 + TypeScript + Tailwind + Tiptap desktop client.
- React Native + Expo iPhone client.
- Spring Boot + Spring Security + JWT + STOMP/WebSockets backend.
- PostgreSQL as the source of truth.
- Local-first writes with an outbox and automatic retry.
- Last-write-wins for the initial sync version, with explicit version metadata.
- Soft-delete tombstones so deletes propagate to offline devices.
- Secure token storage, file validation, signed downloads, idempotency, reconnect recovery, and observability.

## How to use in Antigravity

Paste the master prompt as the project-level instruction. Then paste one implementation prompt at a time. Do not ask the agent to build every platform in one pass. Require a passing test/build checkpoint after each prompt before continuing.
