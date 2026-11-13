import { Link } from 'react-router-dom';
import { ChevronRight, Pause, Play } from 'lucide-react';
import type { Album, Artist, Playlist } from '../lib/types';
import { pluralise } from '../lib/format';
import { Artwork } from './Artwork';

interface SectionProps {
  title: string;
  subtitle?: string;
  actionTo?: string;
  actionLabel?: string;
  children: React.ReactNode;
}

export function Section({ title, subtitle, actionTo, actionLabel, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-balance">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {actionTo && (
          <Link
            to={actionTo}
            className="flex items-center gap-0.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-fg"
          >
            {actionLabel ?? 'See all'}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">{children}</div>
    </section>
  );
}

interface AlbumCardProps {
  album: Album;
  onPlay?: (album: Album) => void;
  playing?: boolean;
}

export function AlbumCard({ album, onPlay, playing }: AlbumCardProps) {
  return (
    <Link
      to={`/album/${album.id}`}
      className="group flex w-[172px] shrink-0 flex-col gap-2.5 rounded-xl p-3 transition-colors hover:bg-white/[0.05]"
    >
      <div className="relative">
        <Artwork
          src={album.cover_url}
          title={album.title}
          seed={album.id}
          className="aspect-square w-full"
          rounded="rounded-lg"
        />
        {onPlay && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onPlay(album);
            }}
            aria-label={playing ? 'Pause' : `Play ${album.title}`}
            className={`absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent transition-all duration-200 hover:scale-105 ${
              playing ? 'opacity-100' : 'translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
            }`}
          >
            {playing ? <Pause size={19} className="fill-accent-ink" /> : <Play size={19} className="ml-0.5 fill-accent-ink" />}
          </button>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{album.title}</div>
        <div className="truncate text-xs text-muted">
          {album.release_year ? `${album.release_year} · ` : ''}
          {album.artist?.name ?? 'Unknown Artist'}
        </div>
      </div>
    </Link>
  );
}

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="group flex w-[152px] shrink-0 flex-col items-center gap-2.5 rounded-xl p-3 transition-colors hover:bg-white/[0.05]"
    >
      <Artwork
        src={artist.image_url}
        title={artist.name}
        seed={artist.id}
        className="aspect-square w-full"
        rounded="rounded-full"
      />
      <div className="w-full min-w-0 text-center">
        <div className="truncate text-sm font-semibold">{artist.name}</div>
        <div className="text-xs text-muted">Artist</div>
      </div>
    </Link>
  );
}

interface PlaylistCardProps {
  playlist: Playlist;
  tracks: number;
}

export function PlaylistCard({ playlist, tracks }: PlaylistCardProps) {
  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="group flex w-[172px] shrink-0 flex-col gap-2.5 rounded-xl p-3 transition-colors hover:bg-white/[0.05]"
    >
      <Artwork
        src={playlist.cover_url}
        title={playlist.name}
        seed={playlist.id}
        className="aspect-square w-full"
        rounded="rounded-lg"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{playlist.name}</div>
        <div className="truncate text-xs text-muted">{pluralise(tracks, 'track')}</div>
      </div>
    </Link>
  );
}

interface GenreCardProps {
  genre: string;
  count: number;
}

const GENRE_COLORS: Record<string, string> = {
  Electronic: '#0f766e',
  Ambient: '#1e40af',
  Rock: '#be123c',
  Pop: '#c2410c',
  'Hip-Hop': '#b45309',
  Jazz: '#15803d',
  Classical: '#a16207',
  Folk: '#3f6212',
  Experimental: '#9f1239',
  Punk: '#7c2d12',
  Metal: '#44403c',
  Techno: '#0e7490',
  House: '#166534',
  Dance: '#be123c',
  'Lo-Fi': '#57534e',
  Instrumental: '#1e3a8a',
  Funk: '#92400e',
  World: '#166534',
  Blues: '#1e40af',
  Reggae: '#15803d',
  Soul: '#9f1239',
  Country: '#a16207',
  Spoken: '#57534e',
};

export function genreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? '#0f766e';
}

export function GenreCard({ genre, count }: GenreCardProps) {
  return (
    <Link
      to={`/genre/${encodeURIComponent(genre)}`}
      className="relative aspect-[1.6/1] shrink-0 overflow-hidden rounded-xl p-4 transition-transform duration-200 hover:scale-[1.02]"
      style={{ width: 220, background: genreColor(genre) }}
    >
      <span className="text-lg font-bold leading-tight text-white drop-shadow-sm">{genre}</span>
      <span className="absolute bottom-3 left-4 text-xs font-medium text-white/85">
        {pluralise(count, 'track')}
      </span>
      <div className="absolute -bottom-5 -right-5 h-20 w-20 rotate-12 rounded-lg bg-black/20" />
    </Link>
  );
}
