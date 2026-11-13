import { useCallback, useEffect, useState } from 'react';
import type { Track } from './types';
import { fetchLikedTrackIds, fetchLikedTracks, toggleLike } from './api';
import { useAuthUser } from './useAuth';

/** Liked-song state shared by every screen that renders a track list. */
export function useLikedTracks() {
  const user = useAuthUser();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLikedIds(new Set());
      setLikedTracks([]);
      setLoaded(false);
      return;
    }
    try {
      const [ids, tracks] = await Promise.all([
        fetchLikedTrackIds(user.id),
        fetchLikedTracks(user.id),
      ]);
      setLikedIds(ids);
      setLikedTracks(tracks);
    } catch {
      setLikedIds(new Set());
      setLikedTracks([]);
    } finally {
      setLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!user) return false;
      const nowLiked = await toggleLike(user.id, track.id);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (nowLiked) next.add(track.id);
        else next.delete(track.id);
        return next;
      });
      return nowLiked;
    },
    [user?.id],
  );

  return { likedIds, likedTracks, toggle, refresh, loaded };
}
