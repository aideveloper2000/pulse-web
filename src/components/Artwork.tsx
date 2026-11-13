import { useState } from 'react';
import { coverGradient } from '../lib/format';

interface ArtworkProps {
  src?: string | null;
  title?: string;
  seed: string | number;
  className?: string;
  rounded?: string;
}

/** Cover art with a deterministic gradient fallback when no image exists. */
export function Artwork({
  src,
  title,
  seed,
  className = '',
  rounded = 'rounded-md',
}: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initial = (title ?? String(seed)).trim().charAt(0).toUpperCase() || 'P';

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${rounded} ${className}`}
      style={{ background: coverGradient(seed) }}
    >
      {showImage ? (
        <img
          src={src!}
          alt={title ?? ''}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[1.6em] font-black leading-none text-white/90">{initial}</span>
        </div>
      )}
    </div>
  );
}
