import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ListMusic, Pause, Play, Plus, Search, Shuffle, X } from 'lucide-react';
import type { Playlist, Track } from '../lib/types';
import { addToPlaylist, fetchPlaylist, removeFromPlaylist, search } from '../lib/api';
import type { SearchResults } from '../lib/api';
import { formatLongDuration, pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useAuthUser } from '../lib/useAuth';
import { useLikedTracks } from '../lib/useLikedTracks';
import { useToasts } from '../store/toast';
import { Artwork } from '../components/Artwork';
import { TrackList } from '../components/TrackList';

export function PlaylistPage() {
  const { id } = useParams();
  const playlistId = Number(id);
  const user = useAuthUser();
  const toast = useToasts((s) => s.push);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const { likedIds, toggle } = useLikedTracks();
  const play = usePlayer((s) => s.play);
  const togglePlay = usePlayer((s) => s.toggle);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const currentId = usePlayer((s) => s.queue[s.order[s.index]]?.id ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const data = await fetchPlaylist(playlistId);
        if (!active) return;
        if (!data) setNotFound(true);
        setPlaylist(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [playlistId]);

  useEffect(() => {
    if (!adding) return;
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      setSearching(true);
      try {
        setResults(await search(query, 20));
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, adding]);

  const tracks = useMemo(
    () =>
      (playlist?.playlist_tracks ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((pt) => pt.track)
        .filter((t): t is Track => Boolean(t)),
    [playlist],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-1 pt-6 animate-fade">
        <div className="flex items-end gap-6">
          <div className="h-52 w-52 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="flex flex-col gap-3">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-40 animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !playlist) {
    return (
      <div className="flex flex-col items-center gap-3 px-1 py-24 text-center">
        <div className="text-lg font-bold">Playlist not found</div>
        <Link to="/library" className="text-sm text-accent hover:underline">
          Back to your library
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === playlist.user_id;
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0);
  const playlistPlaying = tracks.length > 0 && tracks.some((t) => t.id === currentId) && isPlaying;

  const handlePlay = () => {
    if (!tracks.length) return;
    if (tracks.some((t) => t.id === currentId)) togglePlay();
    else play(tracks, 0);
  };

  const handleShuffle = () => {
    if (!tracks.length) return;
    if (!usePlayer.getState().shuffle) toggleShuffle();
    play(tracks, 0);
  };

  const handleRemove = async (track: Track) => {
    try {
      await removeFromPlaylist(playlist.id, track.id);
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              playlist_tracks: prev.playlist_tracks?.filter((pt) => pt.track_id !== track.id) ?? [],
            }
          : prev,
      );
      toast('Removed from playlist', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove track', 'error');
    }
  };

  const handleAdd = async (track: Track) => {
    try {
      await addToPlaylist(playlist.id, track.id);
      const fresh = await fetchPlaylist(playlist.id);
      if (fresh) setPlaylist(fresh);
      toast(`Added to ${playlist.name}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add track', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-7 px-1 pt-4 animate-fade">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div
          className="flex h-52 w-52 shrink-0 items-center justify-center rounded-xl shadow-pop"
          style={{ background: 'linear-gradient(135deg, #1c1c26 0%, #14141c 100%)' }}
        >
          {playlist.cover_url ? (
            <Artwork
              src={playlist.cover_url}
              title={playlist.name}
              seed={playlist.id}
              className="h-52 w-52"
              rounded="rounded-xl"
            />
          ) : (
            <ListMusic size={56} className="text-faint" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-balance">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="mt-3 text-sm text-muted">{playlist.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-bold text-fg">{user?.user_metadata?.display_name ?? 'You'}</span>
            <span>· {pluralise(tracks.length, 'song')}</span>
            <span>· {formatLongDuration(totalMs)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={!tracks.length}
          aria-label={playlistPlaying ? 'Pause' : 'Play'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent transition-transform hover:scale-105 disabled:opacity-50"
        >
          {playlistPlaying ? (
            <Pause size={24} className="fill-accent-ink" />
          ) : (
            <Play size={24} className="ml-1 fill-accent-ink" />
          )}
        </button>
        <button
          onClick={handleShuffle}
          disabled={!tracks.length}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-muted transition-colors hover:border-white/[0.25] hover:text-fg disabled:opacity-50"
        >
          <Shuffle size={16} />
          Shuffle
        </button>
        {isOwner && (
          <button
            onClick={() => setAdding((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              adding
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:border-white/[0.25] hover:text-fg'
            }`}
          >
            {adding ? <X size={16} /> : <Plus size={16} />}
            Add songs
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-xl border border-line bg-raised/60 p-4 animate-pop">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs to add"
              className="h-10 w-full rounded-full border border-transparent bg-base pl-10 pr-4 text-sm outline-none placeholder:text-faint focus:border-white/[0.18]"
            />
          </div>
          {searching && <div className="px-2 pt-3 text-xs text-faint">Searching…</div>}
          {results && results.tracks.length > 0 && (
            <div className="mt-2 flex flex-col">
              {results.tracks.slice(0, 8).map((track) => (
                <div key={track.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.05]">
                  <Artwork
                    src={track.cover_url}
                    title={track.title}
                    seed={track.id}
                    className="h-9 w-9"
                    rounded="rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="truncate text-xs text-muted">{track.artist?.name}</div>
                  </div>
                  <button
                    onClick={() => void handleAdd(track)}
                    className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-bold text-muted hover:border-white/[0.25] hover:text-fg"
                  >
                    <Plus size={13} />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
          {results && !searching && query.trim() && results.tracks.length === 0 && (
            <div className="px-2 pt-3 text-sm text-faint">No songs found.</div>
          )}
        </div>
      )}

      <TrackList
        tracks={tracks}
        showAlbum
        showPlays
        likedIds={likedIds}
        onToggleLike={(t) => void toggle(t)}
        onRemove={isOwner ? (t) => void handleRemove(t) : undefined}
        emptyMessage="This playlist is empty. Add songs to get started."
      />
    </div>
  );
}
