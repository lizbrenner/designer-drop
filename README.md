# Designer Drop

A central gallery for Cognite designers to share work (screen recordings, screenshots, URLs) with the product team.

## Features

- **Gallery** – Pinterest/Mobbin-style grid of public drops on the home page
- **Upload** – Screen recordings, screenshots, or URLs with title, description, tags, @mentions, project, and labels
- **Visibility** – Public (Cognite users) or private (only you)
- **Manage** – Edit and delete your own drops; view others’ drops

## Setup

### Frontend

1. Install dependencies: `npm install`
2. Add your design system components to `src/design-system/` and configure `components.json` if using shadcn/ui or Aura.
3. Run dev: `npm run dev`
4. Build: `npm run build`

### Backend + Supabase Storage (for uploads)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) and add a Storage bucket named `drops` (public).
2. **Create the drops table** (one-time): In Supabase go to **SQL Editor** → New query → paste the contents of [docs/supabase-drops-table.sql](docs/supabase-drops-table.sql) → Run. This stores drops in Postgres so they persist across server restarts.
3. **Create the digest tables** (for the Weekly digest page): In the SQL Editor, run [docs/supabase-digests-table.sql](docs/supabase-digests-table.sql). This creates `draft_digests` and `digests` so the Digest tab works.
4. **Create the user syntheses table** (for “Synthesize my work”): In the SQL Editor, run [docs/supabase-user-syntheses-table.sql](docs/supabase-user-syntheses-table.sql). This creates `user_syntheses` so users can generate and view synthesized work from My drops.
5. **Seed mock data (optional):** To test with sample industrial/Cognite-style drops, run [docs/supabase-seed-mock-drops.sql](docs/supabase-seed-mock-drops.sql) in the SQL Editor. This inserts 12 example drops (screenshots, recordings, URLs) so you can try the gallery, filters, and digest without uploading your own.
7. **Copy env file:** `cp server/env.example server/.env`
8. **Fill in `server/.env`** with your Supabase Project URL, service role key, and bucket name (see Supabase Dashboard → Project Settings → API, and Storage). For AI synthesis (weekly digest and “Synthesize my work”), set either `OPENAI_API_KEY` or `GEMINI_API_KEY` (or both; Gemini is used for synthesis when set).
9. **Install and run the API server:**
   ```bash
   cd server && npm install && npm run dev
   ```
10. **Run the frontend** (from repo root): `npm run dev`. The Vite dev server proxies `/api` to the backend at `http://localhost:3001`, so uploads and drops API work against the local server.

With the backend running, you can upload files (they go to Supabase Storage) and create drops; drop metadata is stored in Supabase Postgres (see [docs/supabase-drops-table.sql](docs/supabase-drops-table.sql)).

## Project structure

- `server/` – Node API: `POST /api/upload` (Supabase Storage), CRUD for drops (in-memory), [docs/STORAGE_SETUP.md](docs/STORAGE_SETUP.md)
- `src/design-system/` – Design system components and tokens (you add code)
- `src/components/` – App-specific UI (layout, gallery, drop, upload)
- `src/pages/` – Route-level pages
- `src/api/` – Backend client (drops, users, upload)
- `src/hooks/` – Auth and data hooks
- `src/types/` – Drop and user types

## Backend contract

The app expects REST endpoints:

- `GET /drops` – List drops (query: tag, mentionedUserId, project, dateFrom, dateTo, includePrivate)
- `GET /drops/:id` – Get one drop
- `POST /drops` – Create drop (body: CreateDropInput)
- `PUT /drops/:id` – Update drop (body: UpdateDropInput)
- `DELETE /drops/:id` – Delete drop
- `GET /users/search?q=` – Search users for @mentions

See `src/types/drop.ts` for the Drop and CreateDropInput shapes.

## Backend

- **[docs/BACKEND.md](docs/BACKEND.md)** – API contract, data model, auth, and suggested stack.
- **[docs/STORAGE_SETUP.md](docs/STORAGE_SETUP.md)** – Step-by-step storage setup (Supabase, Cloudflare R2, or AWS S3) and backend upload examples.
