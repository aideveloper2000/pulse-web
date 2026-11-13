import { useEffect, useState } from 'react';
import { Check, ListMusic, Plus } from 'lucide-react';
import type { Playlist } from '../lib/types';
import { addToPlaylist, createPlaylist, fetchMyPlaylists } from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useToasts } from '../store/toast';

interface PlaylistPickerProps {
  trackId: number;
  onDone?: () => void;
}

/**
 * Inline "save to playlist" list, rendered inside the track row menu.
 * Creates a playlist inline when none exists yet.
 */
export function PlaylistPicker({ trackId, onDone }: PlaylistPickerProps) {
  const user = useAuthUser();
  const toast = useToasts((s) => s.push);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchMyPlaylists(user.id)
      .then((data) => {
        if (active) setPlaylists(data);
      })
      .catch(() => {
        if (active) setPlaylists([]);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="px-3.5 py-2 text-sm text-muted">Sign in to save tracks to playlists.</div>
    );
  }

  const handleAdd = async (playlist: Playlist) => {
    setBusy(playlist.id);
    try {
      await addToPlaylist(playlist.id, trackId);
      toast(`Added to ${playlist.name}`, 'success');
      onDone?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add to playlist', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(-1);
    try {
      const playlist = await createPlaylist(user.id, trimmed);
      await addToPlaylist(playlist.id, trackId);
      toast(`Added to ${playlist.name}`, 'success');
      onDone?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create playlist', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="max-h-44 overflow-y-auto py-1">
        {playlists === null ? (
          <div className="px-3.5 py-2 text-sm text-muted">Loading…</div>
        ) : playlists.length === 0 ? (
          <div className="px-3.5 py-2 text-sm text-muted">No playlists yet.</div>
        ) : (
          playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => void handleAdd(playlist)}
              disabled={busy !== null}
              className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm hover:bg-white/[0.06] disabled:opacity-50"
            >
              <ListMusic size={15} className="shrink-0 text-faint" />
              <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
              {busy === playlist.id && <Check size={15} className="text-accent" />}
            </button>
          ))
        )}
      </div>
      <div className="border-t border-line p-2">
        {creating ? (
          <div className="flex items-center gap-2 px-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
                if (e.key === 'Escape') setCreating(false);
              }}
              placeholder="Playlist name"
              className="min-w-0 flex-1 rounded-lg border border-line bg-base px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent"
            />
            <button
              onClick={() => void handleCreate()}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink hover:bg-accent-deep"
            >
              Create
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-white/[0.06] hover:text-fg"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08]">
              <Plus size={15} />
            </span>
            New playlist
          </button>
        )}
      </div>
    </div>
  );
}
