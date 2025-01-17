import { useEffect } from 'react';
import { AudioState, AudioTrack } from '../../types/audio';
import { AudioSource } from './useSourceNodes';
import { audioCache } from '../../utils/audio-cache';

interface UseAudioEventsProps {
  audioSourceRef: React.MutableRefObject<AudioSource | undefined>;
  audioState: AudioState;
  tracks: AudioTrack[];
  onStateChange: (state: AudioState) => void;
  onError: (error: string) => void;
  crossfade: (source: AudioSource, nextTrack: AudioTrack, volume: number) => Promise<AudioSource>;
  setVolume: (audioSource: AudioSource | undefined, volume: number) => Promise<void>;
}

export function useAudioEvents({
  audioSourceRef,
  audioState,
  tracks,
  onStateChange,
  onError,
  crossfade,
  setVolume
}: UseAudioEventsProps) {
  // Handle track ended event
  useEffect(() => {
    if (!audioSourceRef.current?.audio) return;
    
    const audio = audioSourceRef.current.audio;
    const handleEnded = async () => {
      if (audioState.isPlaying) {
        try {
          const nextIndex = (audioState.currentTrackIndex + 1) % tracks.length;
          const nextTrack = tracks[nextIndex];

          // Ensure next track is loaded
          await audioCache.loadAudioWithCache(nextTrack);

          const newSource = await crossfade(
            audioSourceRef.current!,
            nextTrack,
            audioState.volume
          );

          audioSourceRef.current = newSource;
          onStateChange({ ...audioState, currentTrackIndex: nextIndex });
        } catch (err) {
          console.error('Failed to handle track ended:', err);
          onError('Failed to transition to next track. Please try again.');
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioState, tracks, crossfade, onStateChange, onError]);

  // Handle volume changes
  useEffect(() => {
    if (!audioSourceRef.current) return;
    setVolume(audioSourceRef.current, audioState.volume);
  }, [audioState.volume, setVolume]);

  // Handle crossfade event from shuffle
  useEffect(() => {
    const handleCrossfade = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        trackIndex: number;
        fadeOut?: boolean;
        fadeIn?: boolean;
        volume?: number;
      }>;
      const { trackIndex, fadeOut, fadeIn, volume } = customEvent.detail;
      
      try {
        const nextTrack = tracks[trackIndex];

        // Ensure next track is loaded
        await audioCache.loadAudioWithCache(nextTrack);

        // Initialize audio source if needed
        if (!audioSourceRef.current) {
          throw new Error('Audio source not initialized');
        }

        if (fadeOut) {
          // Just fade out the current track
          await crossfade(
            audioSourceRef.current,
            nextTrack,
            0 // Fade to silence
          );
        } else if (fadeIn && typeof volume === 'number') {
          // Fade in the new track
          const newSource = await crossfade(
            audioSourceRef.current,
            nextTrack,
            volume
          );
          audioSourceRef.current = newSource;
          if (audioState.isPlaying && newSource.audio.paused) {
            await newSource.audio.play();
          }
        } else {
          // Regular crossfade
          const newSource = await crossfade(
            audioSourceRef.current,
            nextTrack,
            audioState.volume
          );
          audioSourceRef.current = newSource;
          if (audioState.isPlaying && newSource.audio.paused) {
            await newSource.audio.play();
          }
        }

        onStateChange({ ...audioState, currentTrackIndex: trackIndex });
      } catch (err) {
        console.error('Failed to handle crossfade:', err);
        onError(err instanceof Error ? err.message : 'Failed to shuffle track. Please try again.');
      }
    };

    const controller = document.querySelector(`[data-controller="${tracks[0]?.category.toLowerCase().replace(/\s+/g, '-')}"]`);
    if (!controller) return;

    controller.addEventListener('crossfade-to-track', handleCrossfade);
    return () => {
      controller.removeEventListener('crossfade-to-track', handleCrossfade);
    };
  }, [audioState, tracks, crossfade, onStateChange, onError]);
}
