# SyncNotes — Deployment Guide

This guide covers local development, Docker setup, Spring Boot backend deployment, Windows desktop packaging, and iPhone Expo preview/builds.

## Environment Variables

Copy `.env.example` to `.env` in the project root and configure your values:

```env
# Backend Spring Boot Environment
PORT=8080
SPRING_PROFILES_ACTIVE=dev
DATABASE_URL=jdbc:postgresql://localhost:5432/syncnotes
DATABASE_USERNAME=syncnotes_user
DATABASE_PASSWORD=syncnotes_pass
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

# Storage
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=./uploads

# Clients
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080/ws-sync
```

---

## 1. Database & Local Environment

Start PostgreSQL 16 using Docker Compose:

```bash
docker compose up -d
```

Verify that PostgreSQL is healthy:

```bash
docker compose ps
```

---

## 2. Spring Boot API Backend

Build and test the backend:

```bash
cd backend/springboot-api
mvn clean test
```

Run the backend server:

```bash
mvn spring-boot:run
```

The server will listen on `http://localhost:8080` with Flyway database migrations applied automatically on startup.

---

## 3. Windows Desktop Application (Electron)

Build shared packages first:

```bash
npm run build:shared
```

Run desktop client in development mode:

```bash
npm run dev --workspace=apps/desktop
```

Typecheck and build production distribution:

```bash
npm run build --workspace=apps/desktop
```

Package Windows executable installer (`.exe`):

```bash
npm run package --workspace=apps/desktop
```

---

## 4. iPhone Application (React Native / Expo)

Run Expo development server:

```bash
npm run start --workspace=apps/mobile
```

Typecheck mobile codebase:

```bash
npm run typecheck --workspace=apps/mobile
```

To build an iOS production preview or TestFlight binary with EAS (Expo Application Services):

```bash
cd apps/mobile
npx eas-cli build --platform ios
```

---

## 5. Production Server Deployment (Render / Railway / VPS)

1. Provision a PostgreSQL database instance.
2. Deploy `backend/springboot-api` as a Java 17+ container.
3. Configure Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `SPRING_PROFILES_ACTIVE=prod`.
4. Enable HTTPS and WSS (WebSockets over SSL) behind NGINX or cloud load balancer.
