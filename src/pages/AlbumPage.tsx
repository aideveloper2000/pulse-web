import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pause, Play, Shuffle } from 'lucide-react';
import type { Album, Track } from '../lib/types';
import { fetchAlbum, fetchAlbumTracks } from '../lib/api';
import { formatLongDuration, pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useLikedTracks } from '../lib/useLikedTracks';
import { Artwork } from '../components/Artwork';
import { TrackList } from '../components/TrackList';

export function AlbumPage() {
  const { id } = useParams();
  const albumId = Number(id);
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
        const [albumData, trackData] = await Promise.all([
          fetchAlbum(albumId),
          fetchAlbumTracks(albumId),
        ]);
        if (!active) return;
        if (!albumData) setNotFound(true);
        setAlbum(albumData);
        setTracks(trackData);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [albumId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-1 pt-6 animate-fade">
        <div className="flex items-end gap-6">
          <div className="h-52 w-52 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="flex flex-col gap-3">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-40 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-32 animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !album) {
    return (
      <div className="flex flex-col items-center gap-3 px-1 py-24 text-center">
        <div className="text-lg font-bold">Album not found</div>
        <Link to="/" className="text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0);
  const albumPlaying = tracks.length > 0 && tracks.some((t) => t.id === currentId) && isPlaying;

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

  return (
    <div className="flex flex-col gap-7 px-1 pt-4 animate-fade">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Artwork
          src={album.cover_url}
          title={album.title}
          seed={album.id}
          className="h-52 w-52 shadow-pop"
          rounded="rounded-xl"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-balance">
            {album.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <Link to={`/artist/${album.artist_id}`} className="font-bold text-fg hover:underline">
              {album.artist?.name ?? 'Unknown Artist'}
            </Link>
            {album.release_year && <span>· {album.release_year}</span>}
            <span>· {pluralise(tracks.length, 'song')}</span>
            <span>· {formatLongDuration(totalMs)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={!tracks.length}
          aria-label={albumPlaying ? 'Pause' : 'Play'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent transition-transform hover:scale-105 disabled:opacity-50"
        >
          {albumPlaying ? (
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
      </div>

      <TrackList
        tracks={tracks}
        showPlays
        likedIds={likedIds}
        onToggleLike={(t) => void toggle(t)}
      />
    </div>
  );
}
