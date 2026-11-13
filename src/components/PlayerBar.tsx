import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ListMusic,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { selectCurrent, usePlayer } from '../store/player';
import { formatDuration, formatElapsed } from '../lib/format';
import { fetchLikedTrackIds, toggleLike } from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useUi } from '../store/ui';
import { useToasts } from '../store/toast';
import { Artwork } from './Artwork';
import { LikeButton } from './LikeButton';
import { Slider } from './Slider';

export function PlayerBar() {
  const current = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const progressMs = usePlayer((s) => s.progressMs);
  const durationMs = usePlayer((s) => s.durationMs);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);

  const user = useAuthUser();
  const toast = useToasts((s) => s.push);
  const setQueueOpen = useUi((s) => s.setQueueOpen);
  const setFullPlayerOpen = useUi((s) => s.setFullPlayerOpen);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user || !current) {
      setLiked(false);
      return;
    }
    let active = true;
    void fetchLikedTrackIds(user.id)
      .then((ids) => {
        if (active) setLiked(ids.has(current.id));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, current]);

  const handleLike = async () => {
    if (!user) {
      toast('Sign in to save songs', 'info');
      return;
    }
    if (!current) return;
    try {
      const nowLiked = await toggleLike(user.id, current.id);
      setLiked(nowLiked);
      toast(nowLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update likes', 'error');
    }
  };

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <footer className="flex h-[92px] shrink-0 items-center gap-4 border-t border-line bg-surface px-4">
      <div className="flex w-[28%] min-w-0 items-center gap-3">
        {current ? (
          <>
            <Artwork
              src={current.cover_url}
              title={current.title}
              seed={current.id}
              className="h-14 w-14"
              rounded="rounded-lg"
            />
            <div className="min-w-0">
              <Link
                to={current.album_id ? `/album/${current.album_id}` : '#'}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {current.title}
              </Link>
              <Link
                to={current.artist_id ? `/artist/${current.artist_id}` : '#'}
                className="block truncate text-xs text-muted hover:text-fg hover:underline"
              >
                {current.artist?.name ?? 'Unknown Artist'}
              </Link>
            </div>
            <LikeButton liked={liked} onToggle={() => void handleLike()} className="ml-1" />
          </>
        ) : (
          <div className="text-sm text-faint">Pick something to play</div>
        )}
      </div>

      <div className="flex max-w-[560px] flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            aria-pressed={shuffle}
            className={`relative transition-colors ${shuffle ? 'text-accent' : 'text-faint hover:text-fg'}`}
          >
            <Shuffle size={17} />
            {shuffle && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />}
          </button>
          <button onClick={() => prev()} aria-label="Previous" className="text-muted transition-colors hover:text-fg">
            <SkipBack size={20} className="fill-current" />
          </button>
          <button
            onClick={toggle}
            disabled={!current}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-fg text-base transition-transform hover:scale-105"
          >
            {isPlaying ? (
              <Pause size={18} className="fill-base" />
            ) : (
              <Play size={18} className="ml-0.5 fill-base" />
            )}
          </button>
          <button onClick={() => next()} aria-label="Next" className="text-muted transition-colors hover:text-fg">
            <SkipForward size={20} className="fill-current" />
          </button>
          <button
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
            className={`relative transition-colors ${repeat !== 'off' ? 'text-accent' : 'text-faint hover:text-fg'}`}
          >
            {repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
            {repeat !== 'off' && (
              <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
            )}
          </button>
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="w-10 text-right text-[11px] tabular-nums text-faint">
            {formatElapsed(progressMs)}
          </span>
          <Slider
            value={progressMs}
            max={durationMs || (current?.duration_ms ?? 0)}
            onSeek={seek}
            label="Seek"
            className="flex-1"
          />
          <span className="w-10 text-[11px] tabular-nums text-faint">
            {formatDuration(durationMs || current?.duration_ms)}
          </span>
        </div>
      </div>

      <div className="flex w-[28%] items-center justify-end gap-1.5">
        <button
          onClick={() => setQueueOpen(true)}
          aria-label="Open queue"
          className="flex h-9 w-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-white/[0.06] hover:text-fg"
        >
          <ListMusic size={18} />
        </button>
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="flex h-9 w-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-white/[0.06] hover:text-fg"
        >
          <VolumeIcon size={18} />
        </button>
        <Slider
          value={muted ? 0 : volume}
          max={1}
          onSeek={setVolume}
          label="Volume"
          className="w-24"
        />
        <button
          onClick={() => setFullPlayerOpen(true)}
          disabled={!current}
          aria-label="Full player"
          className="flex h-9 w-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-white/[0.06] hover:text-fg disabled:opacity-40"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </footer>
  );
}
