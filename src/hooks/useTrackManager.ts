import { useCallback } from 'react';
import { AudioState } from '../types/audio';
import { useTrackLoader } from './audio/useTrackLoader';
import { useTrackState } from './audio/useTrackState';
import { useTrackShuffle } from './audio/useTrackShuffle';
import { useTrackEvents } from './audio/useTrackEvents';

export function useTrackManager() {
  const {
    loadTracks,
    initializeAudioCache,
    isFullyLoaded
  } = useTrackLoader();

  const [
    {
      brownNoiseState,
      rainState,
      brownNoiseTracks,
      rainTracks,
      isInitialized,
      isShuffling,
      error
    },
    {
      setBrownNoiseState,
      setRainState,
      setBrownNoiseTracks,
      setRainTracks,
      setIsInitialized,
      setIsShuffling,
      setError,
      resetError
    }
  ] = useTrackState();

  const { shuffleTracks: shuffleTracksFn } = useTrackShuffle({
    onError: setError,
    isShuffling,
    setIsShuffling,
    setError,
    brownNoiseState,
    rainState,
    setBrownNoiseTracks,
    setRainTracks,
    setBrownNoiseState,
    setRainState
  });

  useTrackEvents({
    setBrownNoiseTracks,
    setRainTracks,
    setError,
    brownNoiseState,
    rainState
  });

  const shuffleTracks = useCallback(async () => {
    await shuffleTracksFn(brownNoiseTracks, rainTracks);
  }, [shuffleTracksFn, brownNoiseTracks, rainTracks]);

  const retryInitialization = useCallback(async () => {
    setError(null);
    setIsInitialized(false);
    
    try {
      // Load tracks first
      const { brownNoise, rain } = await loadTracks();
      setBrownNoiseTracks(brownNoise);
      setRainTracks(rain);

      // Initialize audio cache with all tracks
      await initializeAudioCache([...brownNoise, ...rain]);

      // Wait for all tracks to be fully loaded
      const checkLoading = () => {
        if (isFullyLoaded()) {
          setIsInitialized(true);
          setError(null);
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError('Failed to initialize. Please try again.');
    }
  }, [loadTracks, initializeAudioCache, isFullyLoaded]);

  return [
    {
      brownNoiseState,
      rainState,
      brownNoiseTracks,
      rainTracks,
      isInitialized,
      isShuffling,
      error
    },
    {
      setBrownNoiseState,
      setRainState,
      shuffleTracks,
      retryInitialization
    }
  ] as const;
}
