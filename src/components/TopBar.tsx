import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Search, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthUser } from '../lib/useAuth';

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthUser();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate('/auth');
  };

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 px-3 sm:px-5">
      <div className="flex items-center gap-2 max-md:hidden">
        <button
          onClick={() => window.history.back()}
          disabled={location.key === 'default'}
          aria-label="Go back"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-fg transition-colors hover:bg-black/70 disabled:opacity-40"
        >
          <ChevronLeft size={19} />
        </button>
        <button
          onClick={() => window.history.forward()}
          disabled={location.key === 'default'}
          aria-label="Go forward"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-fg transition-colors hover:bg-black/70 disabled:opacity-40"
        >
          <ChevronRight size={19} />
        </button>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md flex-1">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums"
          className="h-10 w-full rounded-full border border-transparent bg-white/[0.07] pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-faint hover:bg-white/[0.1] focus:border-white/[0.18] focus:bg-white/[0.1]"
        />
      </form>

      <div className="relative ml-auto">
        {user ? (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-overlay text-sm font-bold text-fg ring-1 ring-line transition-transform hover:scale-105"
          >
            {(user.user_metadata?.display_name ?? user.email ?? 'P').charAt(0).toUpperCase()}
          </button>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-fg px-4 py-2 text-sm font-bold text-base transition-transform hover:scale-105"
          >
            Sign in
          </Link>
        )}

        {menuOpen && user && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-line bg-overlay py-1 shadow-pop animate-pop">
              <div className="border-b border-line px-4 py-3">
                <div className="truncate text-sm font-semibold">
                  {user.user_metadata?.display_name ?? 'Pulse listener'}
                </div>
                <div className="truncate text-xs text-muted">{user.email}</div>
              </div>
              <Link
                to="/upload"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.06]"
              >
                <Upload size={15} className="text-faint" />
                Upload music
              </Link>
              <button
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-white/[0.06]"
              >
                <LogOut size={15} className="text-faint" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
