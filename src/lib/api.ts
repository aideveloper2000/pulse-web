import { supabase } from './supabase';
import type { Album, Artist, Playlist, Track } from './types';

const TRACK_SELECT =
  '*, artist:artists(id,name,image_url), album:albums(id,title,cover_url,release_year)';
const ALBUM_SELECT = '*, artist:artists(id,name,image_url)';

export interface GenreStat {
  genre: string;
  track_count: number;
  album_count: number;
}

export interface ArtistStat {
  id: number;
  name: string;
  image_url: string | null;
  track_count: number;
  total_plays: number;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function throwIfError(error: unknown, message: string) {
  if (error) {
    const err = error as { message?: string };
    throw new Error(`${message}: ${err.message ?? 'unknown error'}`);
  }
}

/** Find an artist by name (case-insensitive) or create it. Returns the artist id. */
export async function ensureArtist(name: string): Promise<number | null> {
  const clean = name.trim();
  if (!clean) return null;
  const { data, error } = await supabase
    .from('artists')
    .select('id,name')
    .ilike('name', escapeLike(clean))
    .limit(10);
  throwIfError(error, 'Lookup failed');
  const match = (data ?? []).find((a) => a.name.toLowerCase() === clean.toLowerCase());
  if (match) return match.id;

  const { data: created, error: insertError } = await supabase
    .from('artists')
    .insert({ name: clean })
    .select('id')
    .maybeSingle();
  if (!insertError && created) return created.id;

  const { data: retry } = await supabase
    .from('artists')
    .select('id,name')
    .ilike('name', escapeLike(clean))
    .limit(10);
  const again = (retry ?? []).find((a) => a.name.toLowerCase() === clean.toLowerCase());
  return again?.id ?? null;
}

// ---------- Catalog ----------

export async function fetchTrending(limit = 12): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .order('plays_count', { ascending: false })
    .limit(limit);
  throwIfError(error, 'Failed to load trending tracks');
  return data ?? [];
}

export async function fetchNewAlbums(limit = 12): Promise<Album[]> {
  const { data, error } = await supabase
    .from('albums')
    .select(ALBUM_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  throwIfError(error, 'Failed to load new releases');
  return data ?? [];
}

export async function fetchGenreStats(): Promise<GenreStat[]> {
  const { data, error } = await supabase
    .from('genre_stats')
    .select('*')
    .order('track_count', { ascending: false });
  throwIfError(error, 'Failed to load genres');
  return data ?? [];
}

export async function fetchArtistStats(limit = 12): Promise<ArtistStat[]> {
  const { data, error } = await supabase
    .from('artist_stats')
    .select('*')
    .order('total_plays', { ascending: false })
    .limit(limit);
  throwIfError(error, 'Failed to load artists');
  return data ?? [];
}

export async function fetchTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('genre', genre)
    .order('plays_count', { ascending: false })
    .limit(limit);
  throwIfError(error, 'Failed to load genre tracks');
  return data ?? [];
}

export async function fetchAlbum(id: number): Promise<Album | null> {
  const { data, error } = await supabase
    .from('albums')
    .select(ALBUM_SELECT)
    .eq('id', id)
    .maybeSingle();
  throwIfError(error, 'Failed to load album');
  return data ?? null;
}

export async function fetchAlbumTracks(albumId: number): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('album_id', albumId)
    .order('track_number', { ascending: true })
    .order('id', { ascending: true });
  throwIfError(error, 'Failed to load album tracks');
  return data ?? [];
}

export async function fetchArtist(id: number): Promise<Artist | null> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error, 'Failed to load artist');
  return data ?? null;
}

export async function fetchArtistTracks(artistId: number, limit = 30): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('artist_id', artistId)
    .order('plays_count', { ascending: false })
    .limit(limit);
  throwIfError(error, 'Failed to load artist tracks');
  return data ?? [];
}

export async function fetchArtistAlbums(artistId: number): Promise<Album[]> {
  const { data, error } = await supabase
    .from('albums')
    .select(ALBUM_SELECT)
    .eq('artist_id', artistId)
    .order('release_year', { ascending: false });
  throwIfError(error, 'Failed to load artist albums');
  return data ?? [];
}

export async function fetchTrack(id: number): Promise<Track | null> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('id', id)
    .maybeSingle();
  throwIfError(error, 'Failed to load track');
  return data ?? null;
}

export async function search(query: string, limit = 30): Promise<SearchResults> {
  const clean = query.trim();
  if (!clean) return { tracks: [], artists: [], albums: [] };
  const like = `%${escapeLike(clean)}%`;

  const [titleMatches, genreMatches, artistMatches, albumMatches] = await Promise.all([
    supabase.from('tracks').select(TRACK_SELECT).ilike('title', like).limit(limit),
    supabase.from('tracks').select(TRACK_SELECT).ilike('genre', like).limit(limit),
    supabase.from('artists').select('id,name,image_url').ilike('name', like).limit(8),
    supabase.from('albums').select(ALBUM_SELECT).ilike('title', like).limit(8),
  ]);
  throwIfError(titleMatches.error, 'Search failed');
  throwIfError(genreMatches.error, 'Search failed');

  const artistIds = (artistMatches.data ?? []).map((artist) => artist.id);
  const tracksByArtist = artistIds.length
    ? await supabase
        .from('tracks')
        .select(TRACK_SELECT)
        .in('artist_id', artistIds)
        .limit(limit)
    : { data: [] as Track[] };

  const byId = new Map<number, Track>();
  for (const track of [
    ...(titleMatches.data ?? []),
    ...(genreMatches.data ?? []),
    ...(tracksByArtist.data ?? []),
  ]) {
    byId.set(track.id, track);
  }

  return {
    tracks: [...byId.values()].slice(0, limit),
    artists: artistMatches.data ?? [],
    albums: albumMatches.data ?? [],
  };
}

// ---------- Library ----------

const PLAYLIST_SELECT =
  '*, playlist_tracks(*, track:tracks(*, artist:artists(id,name,image_url), album:albums(id,title,cover_url)))';

export async function fetchMyPlaylists(userId: string): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  throwIfError(error, 'Failed to load playlists');
  return data ?? [];
}

export async function fetchPlaylist(id: number): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('id', id)
    .maybeSingle();
  throwIfError(error, 'Failed to load playlist');
  return data ?? null;
}

export async function createPlaylist(userId: string, name: string): Promise<Playlist> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({ user_id: userId, name: name.trim() || 'New playlist' })
    .select(PLAYLIST_SELECT)
    .single();
  throwIfError(error, 'Failed to create playlist');
  return data;
}

export async function renamePlaylist(id: number, name: string): Promise<void> {
  const { error } = await supabase.from('playlists').update({ name }).eq('id', id);
  throwIfError(error, 'Failed to rename playlist');
}

export async function deletePlaylist(id: number): Promise<void> {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  throwIfError(error, 'Failed to delete playlist');
}

export async function addToPlaylist(playlistId: number, trackId: number): Promise<void> {
  const { data: existing } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .maybeSingle();
  if (!existing) throw new Error('Playlist not found');

  const { data: last } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from('playlist_tracks')
    .upsert({ playlist_id: playlistId, track_id: trackId, position }, { onConflict: 'playlist_id,track_id' });
  throwIfError(error, 'Failed to add to playlist');
}

export async function removeFromPlaylist(playlistId: number, trackId: number): Promise<void> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
  throwIfError(error, 'Failed to remove from playlist');
}

export async function fetchLikedTracks(userId: string): Promise<Track[]> {
  const { data, error } = await supabase
    .from('likes')
    .select('*, track:tracks(*, artist:artists(id,name,image_url), album:albums(id,title,cover_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  throwIfError(error, 'Failed to load liked songs');
  return (data ?? []).map((row) => row.track).filter(Boolean);
}

export async function fetchLikedTrackIds(userId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('likes')
    .select('track_id')
    .eq('user_id', userId);
  throwIfError(error, 'Failed to load likes');
  return new Set((data ?? []).map((row) => row.track_id));
}

export async function toggleLike(userId: string, trackId: number): Promise<boolean> {
  const { data: existing } = await supabase
    .from('likes')
    .select('track_id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);
    throwIfError(error, 'Failed to unlike');
    return false;
  }
  const { error } = await supabase.from('likes').insert({ user_id: userId, track_id: trackId });
  throwIfError(error, 'Failed to like');
  return true;
}

export async function fetchRecentPlays(userId: string, limit = 20): Promise<Track[]> {
  const { data, error } = await supabase
    .from('play_history')
    .select('*, track:tracks(*, artist:artists(id,name,image_url), album:albums(id,title,cover_url))')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit * 2);
  throwIfError(error, 'Failed to load recent plays');
  const seen = new Set<number>();
  const tracks: Track[] = [];
  for (const row of data ?? []) {
    if (!row.track || seen.has(row.track.id)) continue;
    seen.add(row.track.id);
    tracks.push(row.track);
    if (tracks.length >= limit) break;
  }
  return tracks;
}

export async function recordPlay(userId: string, trackId: number): Promise<void> {
  const { error } = await supabase
    .from('play_history')
    .insert({ user_id: userId, track_id: trackId });
  if (error) console.warn('recordPlay failed', error.message);
}

// ---------- Uploads ----------

export async function uploadTrack(
  userId: string,
  file: File,
  meta: { title: string; artist: string; genre?: string | null },
): Promise<Track> {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'mp3';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file, {
    contentType: file.type || 'audio/mpeg',
    upsert: false,
  });
  throwIfError(uploadError, 'Upload failed');

  const artistId = await ensureArtist(meta.artist);
  const { data, error: insertError } = await supabase
    .from('tracks')
    .insert({
      title: meta.title.trim() || file.name.replace(/\.[^.]+$/, ''),
      artist_id: artistId,
      album_id: null,
      audio_url: path,
      storage_path: path,
      cover_url: null,
      duration_ms: null,
      genre: meta.genre ?? null,
      source: 'upload',
      created_by: userId,
    })
    .select(TRACK_SELECT)
    .single();
  throwIfError(insertError, 'Failed to save track');
  return data;
}

export async function fetchMyUploads(userId: string): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('created_by', userId)
    .eq('source', 'upload')
    .order('created_at', { ascending: false });
  throwIfError(error, 'Failed to load uploads');
  return data ?? [];
}

export async function deleteUpload(trackId: number): Promise<void> {
  const { data: track } = await supabase
    .from('tracks')
    .select('storage_path')
    .eq('id', trackId)
    .maybeSingle();
  if (track?.storage_path) {
    await supabase.storage.from('uploads').remove([track.storage_path]);
  }
  const { error } = await supabase.from('tracks').delete().eq('id', trackId);
  throwIfError(error, 'Failed to delete track');
}

/** Uploaded tracks carry a storage path; swap in a short-lived signed URL. */
export async function resolveUploadUrls(tracks: Track[]): Promise<Record<number, string>> {
  const paths = new Map<string, number[]>();
  for (const track of tracks) {
    if (track.source === 'upload' && track.storage_path) {
      const list = paths.get(track.storage_path) ?? [];
      list.push(track.id);
      paths.set(track.storage_path, list);
    }
  }
  const result: Record<number, string> = {};
  await Promise.all(
    [...paths.entries()].map(async ([path, ids]) => {
      const { data } = await supabase.storage.from('uploads').createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        for (const id of ids) result[id] = data.signedUrl;
      }
    }),
  );
  return result;
}
