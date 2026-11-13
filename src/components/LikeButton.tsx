import { Heart } from 'lucide-react';

interface LikeButtonProps {
  liked: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
  label?: string;
}

export function LikeButton({ liked, onToggle, size = 18, className = '', label }: LikeButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={label ?? (liked ? 'Remove from Liked Songs' : 'Save to Liked Songs')}
      aria-pressed={liked}
      className={`group/like inline-flex items-center justify-center rounded-full transition-colors duration-150 ${className}`}
    >
      <Heart
        size={size}
        className={
          liked
            ? 'fill-accent text-accent'
            : 'fill-transparent text-faint group-hover/like:text-fg'
        }
      />
    </button>
  );
}
