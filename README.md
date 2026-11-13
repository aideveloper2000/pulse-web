# Pulse — web

The web interface for **Pulse**, a music streaming app backed by Supabase.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · Zustand ·
Supabase JS · lucide-react · self-hosted Satoshi.

## Features

- **Browse** — greeting, quick picks, trending, genre mixes, new releases, popular artists, genre browse.
- **Search** — songs by title, genre, artist, or album.
- **Play** — full player bar with queue, shuffle, repeat (off/all/one), seek, volume, and a full-screen now-playing view.
- **Library** — playlists (create, rename tracks, add songs), liked songs, uploads.
- **Uploads** — drag-and-drop your own audio into private Supabase Storage and play it back through signed URLs.
- **Auth** — email + password sign-up and sign-in.

## Screens

`/` home · `/search` · `/library` · `/album/:id` · `/artist/:id` · `/playlist/:id` ·
`/genre/:genre` · `/upload` · `/auth`

## Setup

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

Create the backend first — see [pulse-backend](../pulse-backend) for the Supabase
project, schema, and catalog seed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript check |

## Notes

- Catalog audio streams from the Internet Archive; the app itself hosts no audio except user uploads.
- Anonymous visitors can browse and play the catalog. Signing in unlocks likes, playlists, and uploads.
