import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pause, Play, Shuffle } from 'lucide-react';
import type { Track } from '../lib/types';
import { fetchTracksByGenre } from '../lib/api';
import { pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useLikedTracks } from '../lib/useLikedTracks';
import { TrackList } from '../components/TrackList';
import { genreColor } from '../components/cards';

export function GenrePage() {
  const { genre } = useParams();
  const name = decodeURIComponent(genre ?? '');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { likedIds, toggle } = useLikedTracks();
  const play = usePlayer((s) => s.play);
  const togglePlay = usePlayer((s) => s.toggle);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const currentId = usePlayer((s) => s.queue[s.order[s.index]]?.id ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data = await fetchTracksByGenre(name, 100);
        if (active) setTracks(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [name]);

  const tint = genreColor(name);
  const genrePlaying = tracks.length > 0 && tracks.some((t) => t.id === currentId) && isPlaying;

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
      <div
        className="relative overflow-hidden rounded-2xl p-7 sm:p-10"
        style={{ background: tint }}
      >
        <h1 className="relative text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-5xl">
          {name}
        </h1>
        <p className="relative mt-2 text-sm font-medium text-white/85">
          {pluralise(tracks.length, 'track')}
        </p>
        <div className="absolute -bottom-8 -right-8 h-40 w-40 rotate-12 rounded-2xl bg-black/25" />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={!tracks.length}
          aria-label={genrePlaying ? 'Pause' : 'Play'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent transition-transform hover:scale-105 disabled:opacity-50"
        >
          {genrePlaying ? (
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

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      ) : (
        <TrackList
          tracks={tracks}
          showPlays
          likedIds={likedIds}
          onToggleLike={(t) => void toggle(t)}
          emptyMessage={`No ${name} tracks in the catalog yet.`}
        />
      )}

      <Link to="/search" className="text-sm text-muted hover:text-fg hover:underline">
        Browse all genres
      </Link>
    </div>
  );
}
