import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pause, Play, Shuffle } from 'lucide-react';
import type { Album, Artist, Track } from '../lib/types';
import { fetchArtist, fetchArtistAlbums, fetchArtistTracks } from '../lib/api';
import { formatCount, pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useLikedTracks } from '../lib/useLikedTracks';
import { Artwork } from '../components/Artwork';
import { TrackList } from '../components/TrackList';
import { AlbumCard, Section } from '../components/cards';

export function ArtistPage() {
  const { id } = useParams();
  const artistId = Number(id);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
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
        const [artistData, trackData, albumData] = await Promise.all([
          fetchArtist(artistId),
          fetchArtistTracks(artistId, 20),
          fetchArtistAlbums(artistId),
        ]);
        if (!active) return;
        if (!artistData) setNotFound(true);
        setArtist(artistData);
        setTracks(trackData);
        setAlbums(albumData);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-1 pt-6 animate-fade">
        <div className="flex items-end gap-6">
          <div className="h-44 w-44 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="flex flex-col gap-3">
            <div className="h-9 w-56 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-32 animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !artist) {
    return (
      <div className="flex flex-col items-center gap-3 px-1 py-24 text-center">
        <div className="text-lg font-bold">Artist not found</div>
        <Link to="/" className="text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const totalPlays = tracks.reduce((sum, t) => sum + (t.plays_count ?? 0), 0);
  const artistPlaying = tracks.length > 0 && tracks.some((t) => t.id === currentId) && isPlaying;

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
    <div className="flex flex-col gap-8 px-1 pt-4 animate-fade">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Artwork
          src={artist.image_url}
          title={artist.name}
          seed={artist.id}
          className="h-44 w-44 shadow-pop"
          rounded="rounded-full"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-balance">{artist.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{pluralise(tracks.length, 'track')}</span>
            <span>· {formatCount(totalPlays)} plays</span>
            <span>· {pluralise(albums.length, 'album')}</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <button
              onClick={handlePlay}
              disabled={!tracks.length}
              aria-label={artistPlaying ? 'Pause' : 'Play'}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent transition-transform hover:scale-105 disabled:opacity-50"
            >
              {artistPlaying ? (
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
        </div>
      </div>

      <section>
        <h2 className="mb-3 px-1 text-xl font-bold tracking-tight">Top tracks</h2>
        <div className="overflow-x-auto no-scrollbar">
          <TrackList tracks={tracks} showAlbum showPlays likedIds={likedIds} onToggleLike={(t) => void toggle(t)} />
        </div>
      </section>

      {albums.length > 0 && (
        <Section title="Albums">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </Section>
      )}

      {artist.bio && (
        <section className="rounded-xl border border-line bg-raised/60 p-5">
          <h2 className="mb-2 text-lg font-bold tracking-tight">About</h2>
          <p className="text-sm leading-relaxed text-muted">{artist.bio}</p>
        </section>
      )}
    </div>
  );
}
