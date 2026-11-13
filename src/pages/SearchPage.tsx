import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Disc3, Mic2, SearchX } from 'lucide-react';
import type { Album, Artist, Track } from '../lib/types';
import { fetchGenreStats, search } from '../lib/api';
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
  const [loading, setLoading] = useState(false);
  const { likedIds, toggle } = useLikedTracks();
  const toast = useToasts((s) => s.push);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        if (query.trim()) {
          const found = await search(query, 40);
          if (active) setResults(found);
        } else {
          const stats = await fetchGenreStats();
          if (active) {
            setGenres(stats);
            setResults(null);
          }
        }
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
      <div className="flex flex-col gap-6 px-1 pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Search</h1>
          <p className="mt-1 text-sm text-muted">Browse the catalog by genre, or search above.</p>
        </div>
        <Section title="All genres">
          {loading ? (
            <div className="flex gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-[88px] w-[220px] shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          ) : (
            genres.map((genre) => <GenreCard key={genre.genre} genre={genre.genre} count={genre.track_count} />)
          )}
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
