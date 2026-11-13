import { useState } from 'react';
import { Music } from 'lucide-react';

interface ArtworkProps {
  src?: string | null;
  title?: string;
  seed: string | number;
  className?: string;
  rounded?: string;
}

/** Cover art with a quiet neutral placeholder when no image exists. */
export function Artwork({
  src,
  title,
  seed,
  className = '',
  rounded = 'rounded-xl',
}: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-raised ${rounded} ${className}`}
      style={{ background: 'linear-gradient(135deg, #1c1c26 0%, #14141c 100%)' }}
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
        <div className="flex h-full w-full items-center justify-center text-faint">
          <Music size="1.5em" />
        </div>
      )}
    </div>
  );
}
