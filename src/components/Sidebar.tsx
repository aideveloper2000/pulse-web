import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, LibraryBig, LogOut, Plus, Upload, AudioLines } from 'lucide-react';
import type { Playlist } from '../lib/types';
import { fetchMyPlaylists } from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useToasts } from '../store/toast';
import { supabase } from '../lib/supabase';
import { createPlaylist } from '../lib/api';

interface SidebarProps {
  playlists: Playlist[];
  refreshPlaylists: () => void;
}

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Your Library', icon: LibraryBig },
];

export function Sidebar({ playlists, refreshPlaylists }: SidebarProps) {
  const user = useAuthUser();
  const navigate = useNavigate();
  const toast = useToasts((s) => s.push);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createPlaylist(user.id, trimmed);
      setName('');
      setCreating(false);
      refreshPlaylists();
      toast('Playlist created', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create playlist', 'error');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col gap-2">
      <div className="flex flex-col gap-1 rounded-xl bg-surface px-3 py-3">
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
            <AudioLines size={18} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-black tracking-tight">Pulse</span>
        </Link>
        <nav className="mt-1 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-lg px-2.5 py-2.5 text-sm font-bold transition-colors ${
                  isActive ? 'text-fg' : 'text-muted hover:text-fg'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-surface">
        <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-faint">Playlists</span>
          <button
            onClick={() => (user ? setCreating((v) => !v) : navigate('/auth'))}
            aria-label="Create playlist"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-white/[0.06] hover:text-fg"
          >
            <Plus size={17} />
          </button>
        </div>

        {creating && (
          <div className="px-4 pb-2">
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
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {playlists.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted">
              Create a playlist, or save a track with the ⋯ menu.
            </div>
          ) : (
            playlists.map((playlist) => (
              <NavLink
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive ? 'bg-white/[0.07] text-fg' : 'text-muted hover:text-fg'
                  }`
                }
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-faint">
                  <LibraryBig size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{playlist.name}</span>
                  <span className="block truncate text-xs text-faint">
                    {playlist.playlist_tracks?.length ?? 0} tracks
                  </span>
                </span>
              </NavLink>
            ))
          )}
        </div>

        <div className="border-t border-line p-2">
          <Link
            to="/upload"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-bold text-muted transition-colors hover:text-fg"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07]">
              <Upload size={16} />
            </span>
            Upload music
          </Link>
          {user && (
            <button
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-faint transition-colors hover:text-fg"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07]">
                <LogOut size={15} />
              </span>
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
