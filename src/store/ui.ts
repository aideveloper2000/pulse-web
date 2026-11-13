import { create } from 'zustand';

interface UiStore {
  queueOpen: boolean;
  fullPlayerOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  setFullPlayerOpen: (open: boolean) => void;
}

export const useUi = create<UiStore>((set) => ({
  queueOpen: false,
  fullPlayerOpen: false,
  setQueueOpen: (open) => set({ queueOpen: open }),
  setFullPlayerOpen: (open) => set({ fullPlayerOpen: open }),
}));
