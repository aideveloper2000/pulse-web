# Pulse — product truth

## What it is
Pulse is a music streaming app: a web interface and a mobile interface over one Supabase backend. It streams a catalog of freely-licensed music, lets a listener save likes, build playlists, and upload their own audio.

## Who it is for
Udhai, and whoever he shares it with. A personal streaming client: a browsable free catalog plus a private upload shelf.

## What it must prove
A third-party app can stream real music end-to-end on Supabase — browse, search, play, queue, like, playlist, upload — with a listener going from landing to hearing music in under a minute.

## Facts and constraints
- Backend: Supabase (Auth, Postgres, Storage). Anonymous visitors can read the catalog; only signed-in users write library data.
- Catalog: ~10,000 freely-licensed tracks from the Internet Archive (Free Music Archive, netlabels, 78rpm). Audio streams from archive.org. This is not Spotify's catalog: Spotify's catalog cannot be licensed or dumped into a third-party app, and its terms forbid full-song playback outside Spotify's own clients.
- Uploads are private to the uploading account and play through signed URLs.
- Web first; mobile follows on the same backend and the same design system.
- Supabase project: `pulse-music` (ref `pgbmgjgzsfozkobnvwna`, region ap-southeast-1).

## Success
A listener hears music within a minute of opening the app, and can upload a track and hear it back.

## Out of scope
Spotify catalog integration beyond an optional API plug-in; social features; offline playback.
