import { useEffect, useRef } from 'react';
import { usePlayer } from '../store/player';
import { getPlayableUrl } from '../lib/playable';
import { useAuthUser } from '../lib/useAuth';
import { recordPlay } from '../lib/api';
import { useToasts } from '../store/toast';

/**
 * Owns the single HTMLAudioElement behind the player store: loads sources,
 * drives play/pause, reports progress, advances the queue, records plays.
 * Renders nothing.
 */
export function PlayerEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const user = useAuthUser();
  const userId = user?.id ?? null;
  const currentId = usePlayer((s) => s.queue[s.order[s.index]]?.id ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekTick = usePlayer((s) => s.seekTick);
  const recordedFor = useRef<number | null>(null);
  const toast = useToasts((s) => s.push);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTime = () => {
      const state = usePlayer.getState();
      const duration = Number.isFinite(audio.duration) ? audio.duration * 1000 : undefined;
      state.setProgress(audio.currentTime * 1000, duration);
    };
    const onEnded = () => {
      const state = usePlayer.getState();
      if (state.repeat === 'one') {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
        return;
      }
      state.next(true);
    };
    const onError = () => {
      if (!audio.src) return;
      toast('Playback failed for this track', 'error');
      usePlayer.getState().next(true);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentId) {
      audio.removeAttribute('src');
      audio.load();
      return;
    }
    const track = usePlayer.getState().queue.find((t) => t.id === currentId);
    if (!track) return;
    let cancelled = false;
    void getPlayableUrl(track).then((url) => {
      if (cancelled || !audioRef.current) return;
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      if (usePlayer.getState().isPlaying) {
        const attempt = audioRef.current.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(() => {
            if (usePlayer.getState().isPlaying) usePlayer.setState({ isPlaying: false });
          });
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentId) return;
    if (!isPlaying) {
      audio.pause();
      return;
    }
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        if (usePlayer.getState().isPlaying) usePlayer.setState({ isPlaying: false });
      });
    }
  }, [isPlaying, currentId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !seekTick || !audio.src) return;
    const target = usePlayer.getState().progressMs / 1000;
    if (Math.abs(audio.currentTime - target) > 0.25) audio.currentTime = target;
  }, [seekTick]);

  useEffect(() => {
    if (!userId || !currentId) {
      recordedFor.current = null;
      return;
    }
    if (recordedFor.current === currentId) return;
    recordedFor.current = currentId;
    void recordPlay(userId, currentId);
  }, [userId, currentId]);

  return null;
}
