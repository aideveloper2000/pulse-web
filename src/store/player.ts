import { create } from 'zustand';
import type { Track } from '../lib/types';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerStore {
  queue: Track[];
  order: number[];
  index: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  progressMs: number;
  durationMs: number;
  volume: number;
  muted: boolean;
  seekTick: number;

  play: (tracks: Track[], startIndex?: number) => void;
  playSingle: (track: Track, context?: Track[]) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (ms: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeAt: (queueIndex: number) => void;
  clear: () => void;
  setProgress: (ms: number, durationMs?: number) => void;
}

function buildOrder(length: number, shuffle: boolean, keepQueueIndex: number | null): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  if (!shuffle) return indices;
  const rest = indices.filter((i) => i !== keepQueueIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return keepQueueIndex == null ? rest : [keepQueueIndex, ...rest];
}

export const usePlayer = create<PlayerStore>((set, get) => ({
  queue: [],
  order: [],
  index: 0,
  isPlaying: false,
  shuffle: false,
  repeat: 'off',
  progressMs: 0,
  durationMs: 0,
  volume: 0.8,
  muted: false,
  seekTick: 0,

  play: (tracks, startIndex = 0) => {
    if (!tracks.length) return;
    const start = Math.min(Math.max(startIndex, 0), tracks.length - 1);
    const { shuffle } = get();
    const order = buildOrder(tracks.length, shuffle, start);
    set({
      queue: tracks,
      order,
      index: shuffle ? 0 : start,
      isPlaying: true,
      progressMs: 0,
      durationMs: tracks[start]?.duration_ms ?? 0,
    });
  },

  playSingle: (track, context) => {
    if (context?.length) {
      const idx = context.findIndex((t) => t.id === track.id);
      get().play(context, idx >= 0 ? idx : 0);
    } else {
      get().play([track], 0);
    }
  },

  toggle: () => {
    const { queue, isPlaying } = get();
    if (!queue.length) return;
    set({ isPlaying: !isPlaying });
  },

  next: (auto = false) => {
    const { queue, order, index, repeat } = get();
    if (!queue.length) return;
    if (auto && repeat === 'one') {
      set({ progressMs: 0, isPlaying: true });
      return;
    }
    if (index + 1 < order.length) {
      set({ index: index + 1, progressMs: 0 });
      return;
    }
    if (auto) {
      if (repeat === 'all') set({ index: 0, progressMs: 0 });
      else set({ isPlaying: false });
      return;
    }
    set({ index: 0, progressMs: 0 });
  },

  prev: () => {
    const { queue, order, index, progressMs } = get();
    if (!queue.length) return;
    if (progressMs > 3000) {
      set({ progressMs: 0 });
      return;
    }
    if (index > 0) set({ index: index - 1, progressMs: 0 });
    else if (order.length > 1) set({ index: order.length - 1, progressMs: 0 });
  },

  seek: (ms) => set((s) => ({ progressMs: ms, seekTick: s.seekTick + 1 })),

  setVolume: (value) => set({ volume: Math.min(1, Math.max(0, value)), muted: false }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),

  toggleShuffle: () => {
    const { queue, order, index, shuffle } = get();
    if (!queue.length) return;
    const currentQueueIndex = order[index];
    const next = !shuffle;
    const newOrder = buildOrder(queue.length, next, next ? currentQueueIndex : null);
    const newIndex = next ? 0 : Math.max(0, newOrder.indexOf(currentQueueIndex));
    set({ shuffle: next, order: newOrder, index: newIndex });
  },

  cycleRepeat: () => {
    const { repeat } = get();
    set({ repeat: repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off' });
  },

  enqueue: (track) => {
    const { queue, order, shuffle } = get();
    const newIndex = queue.length;
    set({
      queue: [...queue, track],
      order: shuffle ? [...order, newIndex] : queue.map((_, i) => i).concat(newIndex),
    });
  },

  playNext: (track) => {
    const { queue, order, index, shuffle } = get();
    const newQueueIndex = queue.length;
    const newQueue = [...queue, track];
    const newOrder = shuffle ? [...order] : newQueue.map((_, i) => i);
    newOrder.splice(index + 1, 0, newQueueIndex);
    set({ queue: newQueue, order: newOrder });
  },

  removeAt: (queueIndex) => {
    const { queue, order, index } = get();
    if (queueIndex < 0 || queueIndex >= queue.length) return;
    const newQueue = queue.filter((_, i) => i !== queueIndex);
    if (!newQueue.length) {
      set({ queue: [], order: [], index: 0, isPlaying: false, progressMs: 0, durationMs: 0 });
      return;
    }
    const removedCurrent = order[index] === queueIndex;
    const newOrder = order
      .filter((i) => i !== queueIndex)
      .map((i) => (i > queueIndex ? i - 1 : i));
    let newIndex = removedCurrent ? Math.min(index, newOrder.length - 1) : newOrder.indexOf(order[index] > queueIndex ? order[index] - 1 : order[index]);
    if (newIndex < 0) newIndex = 0;
    set({ queue: newQueue, order: newOrder, index: newIndex, progressMs: 0 });
  },

  clear: () =>
    set({
      queue: [],
      order: [],
      index: 0,
      isPlaying: false,
      progressMs: 0,
      durationMs: 0,
      shuffle: false,
      repeat: 'off',
    }),

  setProgress: (ms, durationMs) =>
    set((s) => ({
      progressMs: ms,
      durationMs: durationMs && durationMs > 0 ? durationMs : s.durationMs,
    })),
}));

export function selectCurrent(state: PlayerStore): Track | null {
  return state.queue[state.order[state.index]] ?? null;
}
