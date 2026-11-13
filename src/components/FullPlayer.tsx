import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { selectCurrent, usePlayer } from '../store/player';
import { formatDuration } from '../lib/format';
import { useUi } from '../store/ui';
import { Artwork } from './Artwork';
import { QueueList, QueueHeading } from './QueueList';
import { Slider } from './Slider';

export function FullPlayer() {
  const open = useUi((s) => s.fullPlayerOpen);
  const setOpen = useUi((s) => s.setFullPlayerOpen);
  const current = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const progressMs = usePlayer((s) => s.progressMs);
  const durationMs = usePlayer((s) => s.durationMs);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const queue = usePlayer((s) => s.queue);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open || !current) return null;

  return (
    <div className="fixed inset-0 z-[95] flex flex-col overflow-hidden animate-fade">
      <div className="absolute inset-0 -z-10 bg-base">
        {current.cover_url && (
          <img
            src={current.cover_url}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-45 blur-3xl"
          />
        )}
        <div className="absolute inset-0 bg-base/70" />
      </div>

      <header className="flex h-16 shrink-0 items-center justify-between px-6">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close full player"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-fg transition-colors hover:bg-black/70"
        >
          <ChevronDown size={19} />
        </button>
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Now playing</div>
          {current.album && (
            <Link
              to={`/album/${current.album_id}`}
              onClick={() => setOpen(false)}
              className="text-xs text-faint hover:text-fg hover:underline"
            >
              {current.album.title}
            </Link>
          )}
        </div>
        <div className="w-9" />
      </header>

      <div className="flex min-h-0 flex-1 gap-8 px-6 pb-6">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6">
          <Artwork
            src={current.cover_url}
            title={current.title}
            seed={current.id}
            className="w-full max-w-[420px] aspect-square shadow-pop"
            rounded="rounded-2xl"
          />
          <div className="w-full max-w-[420px]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-2xl font-bold tracking-tight">{current.title}</div>
                <Link
                  to={`/artist/${current.artist_id}`}
                  onClick={() => setOpen(false)}
                  className="block truncate text-base text-muted hover:text-fg hover:underline"
                >
                  {current.artist?.name ?? 'Unknown Artist'}
                </Link>
              </div>
              <button
                aria-label="Like"
                className="mt-1 text-faint transition-colors hover:text-accent"
              >
                <Heart size={22} />
              </button>
            </div>

            <Slider
              value={progressMs}
              max={durationMs || current.duration_ms || 0}
              onSeek={seek}
              label="Seek"
              className="mt-4"
            />
            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint">
              <span>{formatDuration(progressMs)}</span>
              <span>{formatDuration(durationMs || current.duration_ms)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={toggleShuffle}
                aria-label="Toggle shuffle"
                aria-pressed={shuffle}
                className={`transition-colors ${shuffle ? 'text-accent' : 'text-faint hover:text-fg'}`}
              >
                <Shuffle size={19} />
              </button>
              <button onClick={() => prev()} aria-label="Previous" className="text-fg">
                <SkipBack size={26} className="fill-current" />
              </button>
              <button
                onClick={toggle}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-fg text-base transition-transform hover:scale-105"
              >
                {isPlaying ? <Pause size={24} className="fill-base" /> : <Play size={24} className="ml-1 fill-base" />}
              </button>
              <button onClick={() => next()} aria-label="Next" className="text-fg">
                <SkipForward size={26} className="fill-current" />
              </button>
              <button
                onClick={cycleRepeat}
                aria-label={`Repeat: ${repeat}`}
                className={`transition-colors ${repeat !== 'off' ? 'text-accent' : 'text-faint hover:text-fg'}`}
              >
                {repeat === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}
              </button>
            </div>
          </div>
        </div>

        {queue.length > 1 && (
          <div className="hidden w-[340px] shrink-0 flex-col border-l border-white/[0.07] pl-6 lg:flex">
            <div className="py-2">
              <QueueHeading count={queue.length} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <QueueList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
