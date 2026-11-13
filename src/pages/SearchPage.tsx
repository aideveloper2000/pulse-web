import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Disc3, Mic2, SearchX } from 'lucide-react';
import type { Album, Artist, Track } from '../lib/types';
import { fetchGenreStats, fetchTrending, search } from '../lib/api';
import type { GenreStat, SearchResults } from '../lib/api';
import { usePlayer } from '../store/player';
import { useLikedTracks } from '../lib/useLikedTracks';
import { useToasts } from '../store/toast';
import { AlbumCard, ArtistCard, GenreCard, Section } from '../components/cards';
import { TrackList } from '../components/TrackList';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const [results, setResults] = useState<SearchResults | null>(null);
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { likedIds, toggle } = useLikedTracks();
  const toast = useToasts((s) => s.push);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        if (query.trim()) {
          const found = await search(query, 40);
          if (active) setResults(found);
        } else {
          const [stats, trend] = await Promise.all([fetchGenreStats(), fetchTrending(6)]);
          if (active) {
            setGenres(stats);
            setTrending(trend);
            setResults(null);
          }
        }
      } catch {
        if (active) setError('Search failed. Check your connection and retry.');
      } finally {
        if (active) setLoading(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleLike = async (track: Track) => {
    try {
      const nowLiked = await toggle(track);
      toast(nowLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update likes', 'error');
    }
  };

  if (!query.trim()) {
    return (
      <div className="flex flex-col gap-8 px-1 pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Search</h1>
          <p className="mt-1 text-sm text-muted">Browse the catalog by genre, or search above.</p>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-pop">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full border border-danger/40 px-3 py-1 text-xs font-bold hover:bg-danger/10"
            >
              Retry
            </button>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xl font-bold tracking-tight">All genres</h2>
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-[68px] animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {genres.map((genre) => (
                <GenreCard key={genre.genre} genre={genre.genre} count={genre.track_count} />
              ))}
            </div>
          )}
        </section>

        <Section title="Trending right now" subtitle="The most played tracks on Pulse">
          <div className="w-full min-w-0 rounded-xl border border-line bg-raised/60 px-2 py-1">
            <TrackList tracks={trending.slice(0, 6)} showPlays />
          </div>
        </Section>
      </div>
    );
  }

  const tracks = results?.tracks ?? [];
  const artists = results?.artists ?? [];
  const albums = results?.albums ?? [];

  return (
    <div className="flex flex-col gap-8 px-1 pt-2">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Results for “{query}”
        </h1>
        <p className="mt-1 text-sm text-muted">
          {loading ? 'Searching…' : `${tracks.length} songs · ${artists.length} artists · ${albums.length} albums`}
        </p>
      </div>

      {!loading && tracks.length === 0 && artists.length === 0 && albums.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <SearchX size={28} className="text-faint" />
          <div>
            <div className="font-semibold">No results for “{query}”</div>
            <p className="mt-1 text-sm text-muted">Check the spelling, or try an artist, album or genre.</p>
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 px-1 text-xl font-bold tracking-tight">
            <Disc3 size={19} className="text-accent" />
            Songs
          </h2>
          <div className="overflow-x-auto no-scrollbar">
            <TrackList tracks={tracks} showPlays likedIds={likedIds} onToggleLike={(t) => void handleLike(t)} />
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <Section title="Artists">
          {artists.map((artist) => (
            <div key={artist.id} className="w-[152px] shrink-0">
              <ArtistCard artist={artist} />
            </div>
          ))}
        </Section>
      )}

      {albums.length > 0 && (
        <Section title="Albums">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </Section>
      )}

      {!loading && albums.length === 0 && artists.length === 0 && tracks.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-raised/60 px-4 py-4 text-sm text-muted">
          <Mic2 size={16} className="shrink-0 text-accent" />
          Looking for an artist or album? Try their exact name.
        </div>
      )}
    </div>
  );
}
