import { useRef, useState } from 'react';

interface SliderProps {
  value: number;
  max: number;
  onSeek: (value: number) => void;
  className?: string;
  showThumb?: boolean;
  label?: string;
}

/** Pointer-driven seek bar used for playback progress and volume. */
export function Slider({ value, max, onSeek, className = '', showThumb = true, label }: SliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const seekFromClientX = (clientX: number) => {
    const el = ref.current;
    if (!el || max <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * max);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      className={`group/slider relative flex h-4 cursor-pointer items-center ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        seekFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) seekFromClientX(e.clientX);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(Math.min(max, value + 5000));
        if (e.key === 'ArrowLeft') onSeek(Math.max(0, value - 5000));
      }}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/[0.14]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${dragging ? 'bg-accent' : 'bg-white group-hover/slider:bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showThumb && (
        <div
          className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-opacity ${
            dragging ? 'opacity-100' : 'opacity-0 group-hover/slider:opacity-100'
          }`}
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  );
}
