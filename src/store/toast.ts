import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'error';
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, kind?: Toast['kind']) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, kind = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
