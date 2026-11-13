import { X } from 'lucide-react';
import { selectCurrent, usePlayer } from '../store/player';
import { formatDuration } from '../lib/format';
import { Artwork } from './Artwork';

export function QueueList() {
  const queue = usePlayer((s) => s.queue);
  const order = usePlayer((s) => s.order);
  const index = usePlayer((s) => s.index);
  const current = usePlayer(selectCurrent);
  const play = usePlayer((s) => s.play);
  const removeAt = usePlayer((s) => s.removeAt);

  if (!queue.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-faint">
        Your queue is empty. Play something.
      </div>
    );
  }

  const upNext = order.slice(index + 1);

  return (
    <div className="flex flex-col gap-0.5">
      {current && (
        <div className="px-3 pb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-faint">Now playing</div>
          <QueueRow
            track={current}
            active
            onPlay={() => play(queue, order[index])}
            onRemove={() => removeAt(order[index])}
          />
        </div>
      )}
      <div className="px-3 pb-2 pt-1">
        <div className="text-xs font-bold uppercase tracking-wider text-faint">
          Next up ({upNext.length})
        </div>
      </div>
      {upNext.length === 0 ? (
        <div className="px-5 pb-6 text-sm text-faint">Nothing queued after this.</div>
      ) : (
        upNext.map((queueIndex, i) => {
          const track = queue[queueIndex];
          if (!track) return null;
          return (
            <QueueRow
              key={`${track.id}-${queueIndex}`}
              track={track}
              position={i + 1}
              onPlay={() => play(queue, queueIndex)}
              onRemove={() => removeAt(queueIndex)}
            />
          );
        })
      )}
    </div>
  );
}

interface QueueRowProps {
  track: NonNullable<ReturnType<typeof selectCurrent>>;
  active?: boolean;
  position?: number;
  onPlay: () => void;
  onRemove: () => void;
}

function QueueRow({ track, active, position, onPlay, onRemove }: QueueRowProps) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 ${
        active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
      }`}
    >
      <button onClick={onPlay} className="flex h-9 w-9 shrink-0 items-center justify-center" aria-label="Play">
        <Artwork
          src={track.cover_url}
          title={track.title}
          seed={track.id}
          className="h-9 w-9"
          rounded="rounded-md"
        />
        {position != null && (
          <span className="sr-only">{position}</span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-medium ${active ? 'text-accent' : ''}`}>{track.title}</div>
        <div className="truncate text-xs text-muted">{track.artist?.name ?? 'Unknown Artist'}</div>
      </div>
      <span className="text-xs tabular-nums text-faint">{formatDuration(track.duration_ms)}</span>
      <button
        onClick={onRemove}
        aria-label="Remove from queue"
        className="flex h-7 w-7 items-center justify-center rounded-full text-faint opacity-0 transition-opacity hover:text-fg group-hover:opacity-100"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function QueueHeading({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-bold tracking-tight">Queue</h2>
      <span className="text-sm text-muted">{count} tracks</span>
    </div>
  );
}
