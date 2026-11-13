import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useToasts } from '../store/toast';

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-32 left-1/2 z-[120] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className="pointer-events-auto flex w-auto max-w-full items-center gap-2.5 rounded-full border border-line bg-overlay px-4 py-2.5 text-sm font-medium text-fg shadow-pop animate-pop"
        >
          {toast.kind === 'success' && <CheckCircle2 size={16} className="shrink-0 text-accent" />}
          {toast.kind === 'error' && <XCircle size={16} className="shrink-0 text-danger" />}
          {toast.kind === 'info' && <Info size={16} className="shrink-0 text-muted" />}
          <span className="truncate">{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
