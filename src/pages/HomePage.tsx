import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, TrendingUp } from 'lucide-react';
import type { Album, Track } from '../lib/types';
import type { ArtistStat, GenreStat } from '../lib/api';
import {
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
import { AlbumCard, ArtistCard, GenreCard, Section } from '../components/cards';
import { TrackList } from '../components/TrackList';
import { Artwork } from '../components/Artwork';

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

type QuickPick =
  | { kind: 'track'; track: Track }
  | { kind: 'album'; album: Album };

export function HomePage() {
  const user = useAuthUser();
  const play = usePlayer((s) => s.play);
  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [artists, setArtists] = useState<ArtistStat[]>([]);
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [mixBusy, setMixBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
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
        if (user) {
          const rec = await fetchRecentPlays(user.id, 8);
          if (active && rec.length) setRecent(rec);
        }
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

  const handleQuickPick = (pick: QuickPick, index: number) => {
    if (pick.kind === 'track') {
      play(recent.length ? recent : [pick.track], index);
    } else {
      window.location.assign(`/album/${pick.album.id}`);
    }
  };

  const playMix = async (genre: string) => {
    setMixBusy(genre);
    try {
      const tracks = await fetchTracksByGenre(genre, 40);
      if (tracks.length) play(tracks, 0);
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
                onClick={() => handleQuickPick(pick, index)}
                className="group flex items-center gap-3 overflow-hidden rounded-lg bg-white/[0.06] text-left transition-colors hover:bg-white/[0.12]"
              >
                <Artwork
                  src={cover}
                  title={title}
                  seed={id}
                  className="h-14 w-14"
                  rounded="rounded-none"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{title}</span>
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

      <Section title="Trending now" subtitle="The most played tracks on Pulse" actionTo="/search">
        <div className="w-full min-w-0 rounded-xl border border-line bg-raised/60 px-2 py-1">
          <TrackList tracks={trending.slice(0, 8)} showPlays />
        </div>
      </Section>

      <Section title="Made for you" subtitle="Genre mixes built from the catalog">
        {genres.slice(0, 4).map((genre) => (
          <button
            key={genre.genre}
            onClick={() => void playMix(genre.genre)}
            disabled={mixBusy !== null}
            className="group flex w-[172px] shrink-0 flex-col gap-2.5 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-60"
          >
            <div className="relative">
              <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br from-accent/80 to-emerald-900">
                <Sparkles size={26} className="text-white/90" />
              </div>
              <span className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 shadow-accent transition-all group-hover:opacity-100">
                {mixBusy === genre.genre ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-ink/40 border-t-accent-ink" />
                ) : (
                  <Play size={19} className="ml-0.5 fill-accent-ink" />
                )}
              </span>
            </div>
            <div>
              <div className="truncate text-sm font-semibold">{genre.genre} mix</div>
              <div className="truncate text-xs text-muted">{pluralise(genre.track_count, 'track')}</div>
            </div>
          </button>
        ))}
      </Section>

      <Section title="New releases" actionTo="/search">
        {newReleases.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </Section>

      <Section title="Popular artists" actionTo="/search">
        {artists.map((artist) => (
          <div key={artist.id} className="w-[152px] shrink-0">
            <ArtistCard
              artist={{ id: artist.id, name: artist.name, image_url: artist.image_url, bio: null }}
            />
          </div>
        ))}
      </Section>

      <Section title="Browse genres" actionTo="/search">
        {genres.slice(0, 8).map((genre) => (
          <GenreCard key={genre.genre} genre={genre.genre} count={genre.track_count} />
        ))}
      </Section>

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
