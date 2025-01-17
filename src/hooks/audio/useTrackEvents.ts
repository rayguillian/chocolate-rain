import { useEffect } from 'react';
import { AudioTrack, AudioState } from '../../types/audio';
import { setupStorageChangeListeners } from '../../utils/storage-utils';
import { audioCache } from '../../utils/audio-cache';

interface UseTrackEventsProps {
  setBrownNoiseTracks: (tracks: AudioTrack[] | ((prev: AudioTrack[]) => AudioTrack[])) => void;
  setRainTracks: (tracks: AudioTrack[] | ((prev: AudioTrack[]) => AudioTrack[])) => void;
  setError: (error: string | null) => void;
  brownNoiseState: AudioState;
  rainState: AudioState;
}

export function useTrackEvents({
  setBrownNoiseTracks,
  setRainTracks,
  setError,
  brownNoiseState,
  rainState
}: UseTrackEventsProps) {
  useEffect(() => {
    const cleanup = setupStorageChangeListeners(async ({ brownNoise, rain }) => {
      console.log('Storage changes detected, updating tracks');
      try {
        // Update track lists while preserving current track indices and playback state
        setBrownNoiseTracks((prevTracks: AudioTrack[]) => {
          // Only update if there are actual changes
          if (JSON.stringify(prevTracks) === JSON.stringify(brownNoise)) {
            return prevTracks;
          }
          
          const newTracks = [...brownNoise];
          // Keep current track index if it's still valid
          if (brownNoiseState.currentTrackIndex >= newTracks.length) {
            return prevTracks;
          }
          return newTracks;
        });
        
        setRainTracks((prevTracks: AudioTrack[]) => {
          // Only update if there are actual changes
          if (JSON.stringify(prevTracks) === JSON.stringify(rain)) {
            return prevTracks;
          }
          
          const newTracks = [...rain];
          // Keep current track index if it's still valid
          if (rainState.currentTrackIndex >= newTracks.length) {
            return prevTracks;
          }
          return newTracks;
        });
        
        // Update cache for new tracks without reinitializing
        const allTracks = [...brownNoise, ...rain];
        for (const track of allTracks) {
          const status = audioCache.getLoadingStatus(track);
          if (!status.isLoading && status.progress === 0) {
            await audioCache.loadAudioWithCache(track);
          }
        }
      } catch (err) {
        console.error('Failed to update tracks:', err);
        setError('Failed to update tracks. Please try again.');
      }
    });

    return cleanup;
  }, [setBrownNoiseTracks, setRainTracks, setError]);

  return {
    // Return any additional event-related functions if needed
  };
}
