export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '--:--';
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatLongDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '0 min';
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function formatElapsed(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '--:--';
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatCount(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} wk ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

export function pluralise(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** Deterministic gradient pair for covers that have no artwork. */
const COVER_GRADIENTS: Array<[string, string]> = [
  ['#1ee06f', '#0b5c33'],
  ['#f59e0b', '#7c2d12'],
  ['#ff7a59', '#7a2a18'],
  ['#60a5fa', '#1e3a8a'],
  ['#f472b6', '#831843'],
  ['#facc15', '#7a5a12'],
  ['#34d399', '#0b5c46'],
  ['#fb7185', '#7f1d1d'],
];

export function coverGradient(seed: string | number): string {
  const key = String(seed);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const [from, to] = COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}
