import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Pause, Play, ListEnd } from 'lucide-react';
import type { Track } from '../lib/types';
import { formatCount, formatDuration } from '../lib/format';
import { usePlayer } from '../store/player';
import { Artwork } from './Artwork';
import { LikeButton } from './LikeButton';
import { PlaylistPicker } from './PlaylistPicker';

/**
 * Column geometry shared by the header and every row, so the table always lines up:
 * index (1.5rem) | title (fluid) | album (12rem) | plays (4rem) | like (1.75rem) | duration (3rem) | menu (1.75rem)
 */
const COL = {
  index: 'w-6 shrink-0',
  title: 'min-w-0 flex-1',
  album: 'hidden w-48 shrink-0 lg:block',
  plays: 'hidden w-16 shrink-0 xl:block',
  like: 'w-7 shrink-0',
  duration: 'w-12 shrink-0',
  menu: 'w-7 shrink-0',
} as const;

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
  showPlays?: boolean;
  likedIds?: Set<number>;
  onToggleLike?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  emptyMessage?: string;
}

export function TrackList({
  tracks,
  showAlbum = true,
  showPlays = false,
  likedIds,
  onToggleLike,
  onRemove,
  emptyMessage = 'Nothing here yet.',
}: TrackListProps) {
  if (!tracks.length) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-faint">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {showAlbum && showPlays && (
        <div className="flex items-center gap-3 border-b border-line px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
          <span className={`${COL.index} text-center`}>#</span>
          <span className={COL.title}>Title</span>
          <span className={COL.album}>Album</span>
          <span className={`${COL.plays} text-right`}>Plays</span>
          <span className={COL.like} />
          <span className={`${COL.duration} text-right`}>Time</span>
          <span className={COL.menu} />
        </div>
      )}
      {tracks.map((track, index) => (
        <TrackRow
          key={track.id}
          track={track}
          index={index}
          queue={tracks}
          showAlbum={showAlbum}
          showPlays={showPlays}
          liked={likedIds?.has(track.id) ?? false}
          onToggleLike={onToggleLike}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface TrackRowProps {
  track: Track;
  index: number;
  queue: Track[];
  showAlbum: boolean;
  showPlays: boolean;
  liked: boolean;
  onToggleLike?: (track: Track) => void;
  onRemove?: (track: Track) => void;
}

function TrackRow({
  track,
  index,
  queue,
  showAlbum,
  showPlays,
  liked,
  onToggleLike,
  onRemove,
}: TrackRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentId = usePlayer((s) => s.queue[s.order[s.index]]?.id ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const playNext = usePlayer((s) => s.playNext);
  const enqueue = usePlayer((s) => s.enqueue);

  const isCurrent = currentId === track.id;

  const handlePlay = () => {
    if (isCurrent) toggle();
    else play(queue, index);
  };

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isCurrent ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'
      }`}
    >
      <button
        onClick={handlePlay}
        aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
        className={`${COL.index} flex items-center justify-center text-faint`}
      >
        {isCurrent && isPlaying ? (
          <span className="flex items-end gap-[2px]" aria-hidden>
            <span className="w-[3px] animate-eq rounded-full bg-accent" style={{ height: 14 }} />
            <span
              className="w-[3px] animate-eq rounded-full bg-accent"
              style={{ height: 14, animationDelay: '180ms' }}
            />
            <span
              className="w-[3px] animate-eq rounded-full bg-accent"
              style={{ height: 14, animationDelay: '360ms' }}
            />
          </span>
        ) : (
          <>
            <span className={`text-sm tabular-nums group-hover:hidden ${isCurrent ? 'text-accent' : ''}`}>
              {index + 1}
            </span>
            <Play size={15} className="hidden fill-white text-white group-hover:block" />
          </>
        )}
      </button>

      <div className={`${COL.title} flex items-center gap-3`}>
        <Artwork
          src={track.cover_url}
          title={track.title}
          seed={track.id}
          className="h-11 w-11"
          rounded="rounded-md"
        />
        <div className="min-w-0">
          <div className={`truncate text-[0.95rem] font-medium ${isCurrent ? 'text-accent' : 'text-fg'}`}>
            {track.title}
          </div>
          <div className="truncate text-sm text-muted">
            <Link
              to={`/artist/${track.artist_id}`}
              className="hover:text-fg hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist?.name ?? 'Unknown Artist'}
            </Link>
          </div>
        </div>
      </div>

      {showAlbum && (
        <div className={`${COL.album} truncate text-sm text-muted`}>
          {track.album ? (
            <Link
              to={`/album/${track.album_id}`}
              className="hover:text-fg hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {track.album.title}
            </Link>
          ) : (
            <span className="text-faint">Single</span>
          )}
        </div>
      )}

      {showPlays && (
        <div className={`${COL.plays} text-right text-sm tabular-nums text-faint`}>
          {formatCount(track.plays_count)}
        </div>
      )}

      <div className={`${COL.like} flex items-center justify-center`}>
        {onToggleLike && (
          <LikeButton
            liked={liked}
            onToggle={() => onToggleLike(track)}
            className={`${liked ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          />
        )}
      </div>

      <div className={`${COL.duration} text-right text-sm tabular-nums text-faint`}>
        {formatDuration(track.duration_ms)}
      </div>

      <div className={`${COL.menu} relative`}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More options"
          aria-expanded={menuOpen}
          className={`flex h-7 w-7 items-center justify-center rounded-full text-faint hover:text-fg ${
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity`}
        >
          <MoreHorizontal size={17} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-50 w-72 overflow-hidden rounded-xl border border-line bg-overlay py-1 shadow-pop animate-pop">
              <button
                onClick={() => {
                  playNext(track);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm hover:bg-white/[0.06]"
              >
                <ListEnd size={15} className="text-faint" />
                Play next
              </button>
              <button
                onClick={() => {
                  enqueue(track);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm hover:bg-white/[0.06]"
              >
                <ListEnd size={15} className="text-faint" />
                Add to queue
              </button>
              <div className="my-1 border-t border-line" />
              <div className="px-3.5 pb-1 pt-1.5 text-xs font-bold uppercase tracking-wider text-faint">
                Save to playlist
              </div>
              <PlaylistPicker trackId={track.id} onDone={() => setMenuOpen(false)} />
              {onRemove && (
                <>
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={() => {
                      onRemove(track);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-danger hover:bg-white/[0.06]"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
