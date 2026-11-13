import { supabase } from './supabase';
import type { Track } from './types';

interface CacheEntry {
  url: string;
  expires: number;
}

const cache = new Map<number, CacheEntry>();

/**
 * Resolve the playable URL for a track. Catalog tracks carry a public URL;
 * uploaded tracks carry a storage path and need a short-lived signed URL.
 */
export async function getPlayableUrl(track: Track): Promise<string> {
  if (track.source !== 'upload' || !track.storage_path) return track.audio_url;

  const cached = cache.get(track.id);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUrl(track.storage_path, 3600);
  if (error || !data?.signedUrl) {
    console.warn('Failed to sign upload URL', error?.message);
    return track.audio_url;
  }
  cache.set(track.id, { url: data.signedUrl, expires: Date.now() + 3_500_000 });
  return data.signedUrl;
}
