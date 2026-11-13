import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, LibraryBig, Plus, Trash2, Upload } from 'lucide-react';
import type { Playlist, Track } from '../lib/types';
import { createPlaylist, deleteUpload, fetchMyPlaylists, fetchMyUploads } from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useLikedTracks } from '../lib/useLikedTracks';
import { usePlayer } from '../store/player';
import { useToasts } from '../store/toast';
import { Artwork } from '../components/Artwork';
import { TrackList } from '../components/TrackList';
import { PlaylistCard } from '../components/cards';
import { formatDuration } from '../lib/format';

type Tab = 'playlists' | 'liked' | 'uploads';

const TABS: Array<{ id: Tab; label: string; icon: typeof Heart }> = [
  { id: 'playlists', label: 'Playlists', icon: LibraryBig },
  { id: 'liked', label: 'Liked Songs', icon: Heart },
  { id: 'uploads', label: 'Uploads', icon: Upload },
];

export function LibraryPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const toast = useToasts((s) => s.push);
  const play = usePlayer((s) => s.play);
  const [tab, setTab] = useState<Tab>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [uploads, setUploads] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const { likedTracks, likedIds, toggle } = useLikedTracks();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [pl, up] = await Promise.all([fetchMyPlaylists(user.id), fetchMyUploads(user.id)]);
        if (!active) return;
        setPlaylists(pl);
        setUploads(up);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 px-1 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-faint">
          <LibraryBig size={28} />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Your library</h1>
          <p className="mt-1 text-sm text-muted">Sign in to keep playlists, likes and uploads.</p>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink hover:bg-accent-deep"
        >
          Sign in
        </button>
      </div>
    );
  }

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createPlaylist(user.id, trimmed);
      setName('');
      setCreating(false);
      setPlaylists(await fetchMyPlaylists(user.id));
      toast('Playlist created', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create playlist', 'error');
    }
  };

  const handleDelete = async (track: Track) => {
    try {
      await deleteUpload(track.id);
      setUploads((prev) => prev.filter((t) => t.id !== track.id));
      toast('Deleted upload', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete upload', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 px-1 pt-2">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Your library</h1>
        <div className="flex rounded-full border border-line bg-base p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                tab === id ? 'bg-overlay text-fg' : 'text-muted hover:text-fg'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      ) : tab === 'playlists' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            onClick={() => setCreating(true)}
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line text-muted transition-colors hover:border-white/[0.2] hover:text-fg"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
              <Plus size={22} />
            </span>
            <span className="text-sm font-bold">New playlist</span>
          </button>
          {creating && (
            <div className="flex aspect-square flex-col justify-center gap-2 rounded-xl border border-line bg-raised p-4 animate-pop">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                  if (e.key === 'Escape') setCreating(false);
                }}
                placeholder="Playlist name"
                className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent"
              />
              <button
                onClick={() => void handleCreate()}
                className="rounded-lg bg-accent py-2 text-sm font-bold text-accent-ink hover:bg-accent-deep"
              >
                Create
              </button>
            </div>
          )}
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              tracks={playlist.playlist_tracks?.length ?? 0}
            />
          ))}
        </div>
      ) : tab === 'liked' ? (
        <div className="overflow-x-auto no-scrollbar">
          {likedTracks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-6 py-16 text-center">
              <Heart size={26} className="text-faint" />
              <p className="text-sm text-muted">
                Songs you like will live here. Use the heart on any track.
              </p>
            </div>
          ) : (
            <TrackList tracks={likedTracks} showPlays likedIds={likedIds} onToggleLike={(t) => void toggle(t)} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            to="/upload"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-5 text-sm font-semibold text-muted transition-colors hover:border-white/[0.2] hover:text-fg"
          >
            <Upload size={16} />
            Upload more music
          </Link>
          {uploads.length === 0 ? (
            <p className="text-sm text-faint">No uploads yet.</p>
          ) : (
            uploads.map((track) => (
              <div
                key={track.id}
                className="group flex items-center gap-3 rounded-xl border border-line bg-raised/60 px-3 py-2.5"
              >
                <button onClick={() => play(uploads, uploads.findIndex((t) => t.id === track.id))} aria-label="Play">
                  <Artwork
                    src={track.cover_url}
                    title={track.title}
                    seed={track.id}
                    className="h-11 w-11"
                    rounded="rounded-md"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{track.title}</div>
                  <div className="truncate text-xs text-muted">
                    {track.artist?.name ?? 'Unknown Artist'}
                    {track.genre ? ` · ${track.genre}` : ''}
                    {track.duration_ms ? ` · ${formatDuration(track.duration_ms)}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => void handleDelete(track)}
                  aria-label="Delete upload"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
