# Designer Drop – Backend outline

This document outlines how to build the backend so uploaded content (recordings, screenshots, URLs) is stored and available to all Cognite designers and product team members.

---

## 1. Overview

| Concern | Solution |
|--------|----------|
| **Metadata** (drops, users, tags, visibility) | Relational DB (e.g. PostgreSQL) or document store |
| **File storage** (videos, images) | Object / blob storage (S3, R2, Supabase Storage, etc.) |
| **Auth** | Cognite SSO or your IdP; backend validates tokens and resolves `ownerId` |
| **API** | REST (or tRPC) matching the frontend contract in `src/api/` |

The frontend sends **URLs** in `CreateDropInput` (`videoUrl`, `imageUrl`, `thumbnailUrl`, `url`). The backend’s job is to accept file uploads, store them, return those URLs, and persist drop records that reference them.

---

## 2. API contract (match frontend)

Base URL: configurable via `VITE_API_BASE` (default `/api`). All JSON where applicable.

### Drops

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/drops` | List drops. Query: `tag`, `mentionedUserId`, `project`, `dateFrom`, `dateTo`, `includePrivate` (only for current user’s private drops). Return: `Drop[]`. |
| `GET` | `/drops/:id` | Get one drop. Return: `Drop`. 404 if not found or (for private) not owner. |
| `POST` | `/drops` | Create drop. Body: `CreateDropInput`. Require auth; set `ownerId`, `ownerDisplayName`, `ownerAvatarUrl` from token/user. Return: `Drop`. |
| `PUT` | `/drops/:id` | Update drop. Body: `UpdateDropInput`. Require auth; allow only if `ownerId === currentUser.id`. Return: `Drop`. |
| `DELETE` | `/drops/:id` | Delete drop. Require auth; allow only if owner. Return: 204 or 200. |

### File upload (for creating media URLs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Multipart form: `file` (video or image). Upload to object storage; return `{ url: string, thumbnailUrl?: string }`. Require auth. |

Frontend flow: user selects file → `POST /upload` → backend returns URL → frontend calls `POST /drops` with that URL in `videoUrl` / `imageUrl` / `thumbnailUrl`.

### Users (for @mentions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/search?q=` | Search users (e.g. by name/email). Return: `User[]`. Require auth. |
| `GET` | `/users/:id` | Get one user. Return: `User`. Optional. |

Types: see `src/types/drop.ts` and `src/types/user.ts`.

---

## 3. Data model

### Drops table (example PostgreSQL)

```sql
CREATE TABLE drops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  owner_avatar  TEXT,
  type          TEXT NOT NULL CHECK (type IN ('screen_recording', 'screenshot', 'url')),
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  image_url     TEXT,
  url           TEXT,
  thumbnail_url TEXT,
  tags          TEXT[] DEFAULT '{}',
  mentioned_ids TEXT[] DEFAULT '{}',
  project       TEXT,
  labels        TEXT[] DEFAULT '{}',
  visibility    TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drops_owner ON drops(owner_id);
CREATE INDEX idx_drops_visibility_created ON drops(visibility, created_at DESC);
CREATE INDEX idx_drops_tags ON drops USING GIN(tags);
```

- For list: filter by `visibility = 'public'` or (`visibility = 'private'` AND `owner_id = current_user_id` when `includePrivate=true`). Apply tag, project, date, mentionedUserId as needed.
- Resolve `mentionedUsers` for display by querying your users store by `mentioned_ids`.

### Users

Either existing Cognite/user directory or a small `users` table keyed by `id` with `display_name`, `avatar_url`, `email` (and optionally sync from IdP).

---

## 4. File storage (object storage)

- **Upload flow:** Backend receives file in `POST /upload` → stream or buffer to object storage → generate permanent URL (and optional thumbnail URL for video) → return URLs.
- **Storage options:**
  - **AWS S3** (or S3-compatible: MinIO, Cloudflare R2, Backblaze B2): bucket per env; use presigned or public read URLs.
  - **Supabase Storage**: same idea; use Supabase client in backend to upload and get public URL.
  - **Azure Blob Storage** / **Google Cloud Storage**: same pattern.
- **Security:** Restrict write to backend only; read can be public or signed. Prefer a subpath or bucket like `designer-drop/{env}/{year}/{id}.ext` for clarity and cleanup.
- **Thumbnails:** For screen recordings, either client sends a frame as image, or backend uses a small job/worker to extract a frame and upload to the same bucket (then store in `thumbnail_url`).

---

## 5. Auth

- **Cognite SSO (or OIDC):** Frontend gets token (e.g. JWT); sends `Authorization: Bearer <token>` on every request. Backend validates token and reads `sub` / name / avatar to set `ownerId`, `ownerDisplayName`, `ownerAvatarUrl`.
- **Scoping:** List endpoints return only:
  - Public drops for everyone.
  - Private drops only for the owner (when `includePrivate` and request is from that owner).
- **Mutations:** Create/update/delete only when authenticated and (for update/delete) `drop.owner_id === current_user_id`.

---

## 6. Suggested stack (pick one path)

**Option A – Node + Postgres + S3**
- Runtime: Node.js (Express, Fastify, or Hono).
- DB: PostgreSQL (e.g. Neon, Railway, or self-hosted).
- Storage: AWS S3 or Cloudflare R2; SDK upload in `POST /upload`.
- Auth: Validate Cognite/OIDC JWT; optional user table/cache for search.

**Option B – Supabase**
- Postgres + Auth + Storage in one place. Use Supabase Auth (or custom JWT from Cognite); Storage for files; DB tables as above. Frontend can call Supabase from a thin backend or, with RLS, from client (less ideal for multi-tenant or complex rules).

**Option C – Firebase**
- Firestore for drops (and optional user docs); Firebase Storage for files; Firebase Auth or custom token from Cognite. Good if you want a quick, fully managed backend.

---

## 7. Environment / config (backend)

- `DATABASE_URL` – Postgres (or equivalent).
- `STORAGE_*` – Bucket name, region, credentials (e.g. AWS keys or R2 credentials).
- `AUTH_ISSUER`, `AUTH_AUDIENCE`, `AUTH_JWKS_URI` (or similar) for JWT validation.
- `CORS_ORIGIN` – Frontend origin(s).

---

## 8. Frontend changes once backend exists

1. **Upload:** When user selects a file, call `POST /upload` (multipart), then use returned `url` (and `thumbnailUrl`) in `CreateDropInput` instead of `URL.createObjectURL`.
2. **Base URL:** Set `VITE_API_BASE` to your backend root (e.g. `https://api.designer-drop.example.com`).
3. **Auth:** Replace mock in `useAuth` with real Cognite/OIDC login and send `Authorization` header from `api/client.ts` (e.g. from a token in memory or storage).

This keeps the app working with an empty gallery until the backend is deployed, then you plug in the real API and auth.
