import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import type { Playlist } from './lib/types';
import { fetchMyPlaylists } from './lib/api';
import { useAuthUser } from './lib/useAuth';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PlayerBar } from './components/PlayerBar';
import { PlayerEngine } from './components/PlayerEngine';
import { QueuePanel } from './components/QueuePanel';
import { FullPlayer } from './components/FullPlayer';
import { Toaster } from './components/Toaster';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { AlbumPage } from './pages/AlbumPage';
import { ArtistPage } from './pages/ArtistPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { GenrePage } from './pages/GenrePage';
import { UploadPage } from './pages/UploadPage';

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 px-1 py-24 text-center">
      <div className="text-5xl font-black tracking-tight text-faint">404</div>
      <p className="text-sm text-muted">That page does not exist.</p>
      <a href="/" className="text-sm font-semibold text-accent hover:underline">
        Back to home
      </a>
    </div>
  );
}

function MainLayout() {
  const user = useAuthUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const refreshPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }
    try {
      setPlaylists(await fetchMyPlaylists(user.id));
    } catch {
      setPlaylists([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshPlaylists();
  }, [refreshPlaylists]);

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <div className="flex min-h-0 flex-1 gap-2">
        <Sidebar playlists={playlists} refreshPlaylists={refreshPlaylists} />
        <main className="flex min-w-0 flex-1 flex-col rounded-xl bg-surface">
          <TopBar />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-12">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/album/:id" element={<AlbumPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/genre/:genre" element={<GenrePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
      <PlayerBar />
      <QueuePanel />
      <FullPlayer />
      <Toaster />
      <PlayerEngine />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
