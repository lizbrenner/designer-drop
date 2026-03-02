# Designer Drop

A central gallery for Cognite designers to share work (screen recordings, screenshots, URLs) with the product team.

## Features

- **Gallery** – Pinterest/Mobbin-style grid of public drops on the home page
- **Upload** – Screen recordings, screenshots, or URLs with title, description, tags, @mentions, project, and labels
- **Visibility** – Public (Cognite users) or private (only you)
- **Manage** – Edit and delete your own drops; view others’ drops

## Setup

1. Install dependencies: `npm install`
2. Add your design system components to `src/design-system/` and configure `components.json` if using shadcn/ui or Aura.
3. Configure the backend: set `VITE_API_BASE` to your API base URL (default: `/api`). Until then, the gallery loads with an empty list when the API is unavailable.
4. Run dev: `npm run dev`
5. Build: `npm run build`

## Project structure

- `src/design-system/` – Design system components and tokens (you add code)
- `src/components/` – App-specific UI (layout, gallery, drop, upload)
- `src/pages/` – Route-level pages
- `src/api/` – Backend client (drops, users)
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

For how to store uploads and build the API (database, object storage, auth), see **[docs/BACKEND.md](docs/BACKEND.md)**.
