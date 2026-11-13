import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, TrendingUp } from 'lucide-react';
import type { Album, Track } from '../lib/types';
import type { ArtistStat, GenreStat } from '../lib/api';
import {
  fetchAlbumTracks,
  fetchArtistStats,
  fetchGenreStats,
  fetchNewAlbums,
  fetchRecentPlays,
  fetchTracksByGenre,
  fetchTrending,
} from '../lib/api';
import { greeting, pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useAuthUser } from '../lib/useAuth';
import { useToasts } from '../store/toast';
import { AlbumCard, ArtistCard, GenreCard, Section } from '../components/cards';
import { TrackList } from '../components/TrackList';
import { Artwork } from '../components/Artwork';

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

type QuickPick = { kind: 'track'; track: Track } | { kind: 'album'; album: Album };

interface Mix {
  genre: string;
  count: number;
  covers: string[];
}

export function HomePage() {
  const user = useAuthUser();
  const play = usePlayer((s) => s.play);
  const toast = useToasts((s) => s.push);
  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [artists, setArtists] = useState<ArtistStat[]>([]);
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mixBusy, setMixBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [trend, fresh, art, gen] = await Promise.all([
          fetchTrending(12),
          fetchNewAlbums(10),
          fetchArtistStats(10),
          fetchGenreStats(),
        ]);
        if (!active) return;
        setTrending(trend);
        setNewReleases(fresh);
        setArtists(art);
        setGenres(gen);

        const mixGenres = gen.slice(0, 4);
        const mixTracks = await Promise.all(mixGenres.map((g) => fetchTracksByGenre(g.genre, 4)));
        if (!active) return;
        setMixes(
          mixGenres.map((g, i) => ({
            genre: g.genre,
            count: g.track_count,
            covers: (mixTracks[i] ?? [])
              .map((t) => t.cover_url)
              .filter((cover): cover is string => Boolean(cover)),
          })),
        );

        if (user) {
          const rec = await fetchRecentPlays(user.id, 8);
          if (active && rec.length) setRecent(rec);
        }
      } catch {
        if (active) setError('Could not load the catalog. Check your connection and retry.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const quickPicks: QuickPick[] = useMemo(() => {
    if (recent.length) return recent.slice(0, 6).map((track) => ({ kind: 'track', track }));
    return newReleases.slice(0, 6).map((album) => ({ kind: 'album', album }));
  }, [recent, newReleases]);

  const handleQuickPick = async (pick: QuickPick, index: number) => {
    if (pick.kind === 'track') {
      play(recent.length ? recent : [pick.track], index);
      return;
    }
    try {
      const tracks = await fetchAlbumTracks(pick.album.id);
      if (tracks.length) play(tracks, 0);
    } catch {
      toast('Could not open that album', 'error');
    }
  };

  const playMix = async (mix: Mix) => {
    setMixBusy(mix.genre);
    try {
      const tracks = await fetchTracksByGenre(mix.genre, 40);
      if (tracks.length) play(tracks, 0);
    } catch {
      toast('Could not start that mix', 'error');
    } finally {
      setMixBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-9 px-1 pt-2">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{greeting()}</h1>
        {user && (
          <p className="mt-1 text-sm text-muted">{user.user_metadata?.display_name ?? user.email}</p>
        )}
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

      {loading ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {quickPicks.map((pick, index) => {
            const id = pick.kind === 'track' ? pick.track.id : pick.album.id;
            const title = pick.kind === 'track' ? pick.track.title : pick.album.title;
            const subtitle =
              pick.kind === 'track'
                ? (pick.track.artist?.name ?? 'Unknown Artist')
                : (pick.album.artist?.name ?? 'Unknown Artist');
            const cover = pick.kind === 'track' ? pick.track.cover_url : pick.album.cover_url;
            return (
              <button
                key={id}
                onClick={() => void handleQuickPick(pick, index)}
                style={{ animationDelay: `${index * 45}ms` }}
                className="group flex animate-rise items-center gap-3 overflow-hidden rounded-lg bg-white/[0.06] text-left transition-colors hover:bg-white/[0.12]"
              >
                <Artwork
                  src={cover}
                  title={title}
                  seed={id}
                  className="h-14 w-14"
                  rounded="rounded-none"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{title}</span>
                  <span className="block truncate text-xs text-muted">{subtitle}</span>
                </span>
                <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 shadow-accent transition-all group-hover:opacity-100">
                  <Play size={16} className="ml-0.5 fill-accent-ink" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 text-xl font-bold tracking-tight">Recently played</h2>
          <div className="overflow-x-auto no-scrollbar">
            <TrackList tracks={recent} showPlays={false} />
          </div>
        </section>
      )}

      <Section title="Trending now" subtitle="The most played tracks on Pulse">
        <div className="w-full min-w-0 rounded-xl border border-line bg-raised/60 px-2 py-1">
          <TrackList tracks={trending.slice(0, 8)} showPlays />
        </div>
      </Section>

      <Section title="Made for you" subtitle="Genre mixes built from the catalog">
        {mixes.map((mix) => (
          <button
            key={mix.genre}
            onClick={() => void playMix(mix)}
            disabled={mixBusy !== null}
            className="group flex w-[172px] shrink-0 flex-col gap-2.5 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-60"
          >
            <div className="relative">
              <div className="grid aspect-square w-full grid-cols-2 gap-0.5 overflow-hidden rounded-lg bg-raised">
                {mix.covers.slice(0, 4).map((cover, i) => (
                  <img key={i} src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                ))}
                {Array.from({ length: Math.max(0, 4 - mix.covers.length) }, (_, i) => (
                  <div key={`empty-${i}`} className="bg-overlay" />
                ))}
              </div>
              <span className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 shadow-accent transition-all group-hover:opacity-100">
                {mixBusy === mix.genre ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-ink/40 border-t-accent-ink" />
                ) : (
                  <Play size={19} className="ml-0.5 fill-accent-ink" />
                )}
              </span>
            </div>
            <div>
              <div className="truncate text-sm font-semibold">{mix.genre} mix</div>
              <div className="truncate text-xs text-muted">{pluralise(mix.count, 'track')}</div>
            </div>
          </button>
        ))}
      </Section>

      <Section title="New releases">
        {newReleases.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </Section>

      <Section title="Popular artists">
        {artists.map((artist) => (
          <div key={artist.id} className="w-[152px] shrink-0">
            <ArtistCard
              artist={{ id: artist.id, name: artist.name, image_url: artist.image_url, bio: null }}
            />
          </div>
        ))}
      </Section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4 px-1">
          <h2 className="text-xl font-bold tracking-tight">Browse genres</h2>
          <Link to="/search" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-fg">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {genres.slice(0, 8).map((genre) => (
            <GenreCard key={genre.genre} genre={genre.genre} count={genre.track_count} />
          ))}
        </div>
      </section>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-raised/60 px-4 py-4 text-sm text-muted">
        <TrendingUp size={16} className="shrink-0 text-accent" />
        <span>
          {pluralise(trending.length, 'trending track')} right now ·{' '}
          <Link to="/search" className="font-semibold text-fg hover:underline">
            search the full catalog
          </Link>
        </span>
      </div>
    </div>
  );
}
