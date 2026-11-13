import { X } from 'lucide-react';
import { useUi } from '../store/ui';
import { usePlayer } from '../store/player';
import { QueueHeading, QueueList } from './QueueList';

export function QueuePanel() {
  const open = useUi((s) => s.queueOpen);
  const setOpen = useUi((s) => s.setQueueOpen);
  const queue = usePlayer((s) => s.queue);
  const clear = usePlayer((s) => s.clear);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/50 animate-fade" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-[360px] max-w-[92vw] flex-col border-l border-line bg-surface shadow-pop animate-slide-up">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <QueueHeading count={queue.length} />
          <div className="flex items-center gap-3">
            <button
              onClick={clear}
              className="text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-fg"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close queue"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <QueueList />
        </div>
      </aside>
    </div>
  );
}
