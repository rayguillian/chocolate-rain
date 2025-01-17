import { useCallback } from 'react';
import { AudioTrack, AudioState } from '../../types/audio';
import { audioCache } from '../../utils/audio-cache';
import { FADE_IN_DURATION, FADE_OUT_DURATION } from '../../config/ambient-player-config';

interface UseTrackShuffleProps {
  onError: (error: string) => void;
  isShuffling: boolean;
  setIsShuffling: (shuffling: boolean) => void;
  setError: (error: string | null) => void;
  brownNoiseState: AudioState;
  rainState: AudioState;
  setBrownNoiseTracks: (tracks: AudioTrack[]) => void;
  setRainTracks: (tracks: AudioTrack[]) => void;
  setBrownNoiseState: (state: AudioState | ((prev: AudioState) => AudioState)) => void;
  setRainState: (state: AudioState | ((prev: AudioState) => AudioState)) => void;
}

export function useTrackShuffle({
  isShuffling,
  setIsShuffling,
  setError,
  brownNoiseState,
  rainState,
  setBrownNoiseTracks,
  setRainTracks,
  setBrownNoiseState,
  setRainState
}: UseTrackShuffleProps) {
  const shuffleArray = <T,>(array: T[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleSimultaneousCrossfade = async (
    brownNoiseController: Element | null,
    rainController: Element | null,
    brownNoiseVolume: number,
    rainVolume: number
  ): Promise<void> => {
    if (!brownNoiseController && !rainController) return;

    try {
      // Only trigger crossfades for playing tracks
      const brownNoisePlaying = brownNoiseState.isPlaying;
      const rainPlaying = rainState.isPlaying;

      // Trigger fade out only for playing tracks
      if (brownNoisePlaying && brownNoiseController) {
        brownNoiseController.dispatchEvent(
          new CustomEvent('crossfade-to-track', {
            detail: { trackIndex: 0, fadeOut: true }
          })
        );
      }
      if (rainPlaying && rainController) {
        rainController.dispatchEvent(
          new CustomEvent('crossfade-to-track', {
            detail: { trackIndex: 0, fadeOut: true }
          })
        );
      }

      // Only wait for fade out if any track was playing
      if (brownNoisePlaying || rainPlaying) {
        await new Promise(resolve => setTimeout(resolve, FADE_OUT_DURATION));
      }

      // Trigger fade in only for tracks that were playing
      if (brownNoisePlaying && brownNoiseController) {
        brownNoiseController.dispatchEvent(
          new CustomEvent('crossfade-to-track', {
            detail: { trackIndex: 0, fadeIn: true, volume: brownNoiseVolume }
          })
        );
      }
      if (rainPlaying && rainController) {
        rainController.dispatchEvent(
          new CustomEvent('crossfade-to-track', {
            detail: { trackIndex: 0, fadeIn: true, volume: rainVolume }
          })
        );
      }

      // Only wait for fade in if any track was playing
      if (brownNoisePlaying || rainPlaying) {
        await new Promise(resolve => setTimeout(resolve, FADE_IN_DURATION));
      }
    } catch (err) {
      console.error('Error in handleSimultaneousCrossfade:', err);
    }
  };

  const shuffleTracks = useCallback(async (
    brownNoiseTracks: AudioTrack[],
    rainTracks: AudioTrack[]
  ) => {
    if (isShuffling) return;
    
    setError(null);
    setIsShuffling(true);

    try {
      if (!audioCache.isFullyLoaded()) {
        throw new Error('Please wait for all tracks to load before shuffling');
      }

      const shuffledBrownNoise = shuffleArray(brownNoiseTracks);
      const shuffledRain = shuffleArray(rainTracks);

      setBrownNoiseTracks(shuffledBrownNoise);
      setRainTracks(shuffledRain);

      const brownNoiseController = document.querySelector('[data-controller="brown-noise-stream"]');
      const rainController = document.querySelector('[data-controller="rain-makes-everything-better"]');

      if (!brownNoiseController || !rainController) {
        throw new Error('Audio controllers not found');
      }

      // Load both tracks if needed
      if (brownNoiseState.isPlaying) {
        await audioCache.loadAudioWithCache(shuffledBrownNoise[0]);
      }
      if (rainState.isPlaying) {
        await audioCache.loadAudioWithCache(shuffledRain[0]);
      }

      // Handle simultaneous transitions
      if (brownNoiseState.isPlaying || rainState.isPlaying) {
        await handleSimultaneousCrossfade(
          brownNoiseController,
          rainController,
          brownNoiseState.volume,
          rainState.volume
        );
      }

      // Update track indices
      setBrownNoiseState((prev: AudioState) => ({
        ...prev,
        currentTrackIndex: 0
      }));
      setRainState((prev: AudioState) => ({
        ...prev,
        currentTrackIndex: 0
      }));

    } catch (err) {
      console.error('Failed to shuffle tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to shuffle tracks. Please try again.');
      
      // Reset states on error
      setBrownNoiseState((prev: AudioState) => ({
        ...prev,
        currentTrackIndex: prev.currentTrackIndex
      }));
      setRainState((prev: AudioState) => ({
        ...prev,
        currentTrackIndex: prev.currentTrackIndex
      }));
    } finally {
      setIsShuffling(false);
    }
  }, [isShuffling, brownNoiseState.isPlaying, rainState.isPlaying]);

  return {
    shuffleTracks
  };
}
