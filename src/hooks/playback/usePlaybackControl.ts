import { useCallback } from 'react';
import { AudioTrack, AudioState } from '../../types/audio';
import { audioCache } from '../../utils/audio-cache';
import { AudioSource } from './useSourceNodes';

interface UsePlaybackControlProps {
  ensureAudioContext: () => Promise<boolean>;
  initializeAudioSource: (track: AudioTrack, volume: number) => Promise<AudioSource>;
  setVolume: (audioSource: AudioSource | undefined, volume: number) => Promise<void>;
  onError: (error: string) => void;
}

export function usePlaybackControl({
  ensureAudioContext,
  initializeAudioSource,
  setVolume,
  onError
}: UsePlaybackControlProps) {
  const togglePlayback = useCallback(async (
    audioSourceRef: React.MutableRefObject<AudioSource | undefined>,
    tracks: AudioTrack[],
    audioState: AudioState,
    onStateChange: (state: AudioState) => void
  ) => {
    try {
      // Ensure audio context is ready
      const contextReady = await ensureAudioContext();
      if (!contextReady) return;

      // Initialize audio source if needed
      if (!audioSourceRef.current) {
        if (!tracks.length) {
          throw new Error('No tracks available');
        }

        // Ensure track is loaded before initializing
        const currentTrack = tracks[audioState.currentTrackIndex];
        await audioCache.loadAudioWithCache(currentTrack);
        
        audioSourceRef.current = await initializeAudioSource(
          currentTrack,
          audioState.volume
        );
      }

      const newIsPlaying = !audioState.isPlaying;
      
      if (newIsPlaying) {
        await setVolume(audioSourceRef.current, audioState.volume);

        // Ensure audio is fully loaded
        const audio = audioSourceRef.current.audio;
        if (audio.readyState < 4) {
          await new Promise<void>((resolve, reject) => {
            const onCanPlay = () => {
              audio.removeEventListener('canplaythrough', onCanPlay);
              audio.removeEventListener('error', onError);
              resolve();
            };
            const onError = () => {
              audio.removeEventListener('canplaythrough', onCanPlay);
              audio.removeEventListener('error', onError);
              reject(new Error('Failed to load audio'));
            };
            audio.addEventListener('canplaythrough', onCanPlay);
            audio.addEventListener('error', onError);
          });
        }

        // Try to play with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
          try {
            await audioSourceRef.current.audio.play();
            break;
          } catch (playError) {
            console.error(`Error playing audio (attempt ${retryCount + 1}):`, playError);
            retryCount++;
            if (retryCount === maxRetries) {
              throw new Error('Failed to play audio after multiple attempts');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        await audioSourceRef.current.audio.pause();
        if (audioSourceRef.current.nextAudio) {
          await audioSourceRef.current.nextAudio.pause();
        }
      }
      
      onStateChange({ ...audioState, isPlaying: newIsPlaying });
    } catch (err) {
      console.error('Failed to toggle playback:', err);
      onError(err instanceof Error ? err.message : 'Failed to play audio. Please try again.');
    }
  }, [ensureAudioContext, initializeAudioSource, setVolume, onError]);

  return {
    togglePlayback
  };
}
