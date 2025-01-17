import { useCallback } from 'react';
import { AudioTrack } from '../../types/audio';
import { useAudioContext } from '../../hooks/playback/useAudioContext';
import { useSourceNodes, AudioSource } from '../../hooks/playback/useSourceNodes';
import { useVolumeControl } from '../../hooks/playback/useVolumeControl';
import { useCrossfade } from '../../hooks/playback/useCrossfade';

interface AudioEngineProps {
  onError: (error: string) => void;
}

export function useAudioEngine({ onError }: AudioEngineProps) {
  const { ensureAudioContext, getAudioContext, cleanup } = useAudioContext(onError);
  
  const { getOrCreateSourceNode, initializeAudioSource } = useSourceNodes({
    getAudioContext
  });

  const { setVolume, fadeOut, fadeIn } = useVolumeControl({
    getAudioContext,
    ensureAudioContext
  });

  const { crossfade } = useCrossfade({
    getAudioContext,
    getOrCreateSourceNode
  });

  const crossfadeToTrack = useCallback(async (
    source: AudioSource,
    nextTrack: AudioTrack,
    volume: number
  ): Promise<AudioSource> => {
    try {
      await ensureAudioContext();
      return await crossfade(source, nextTrack, volume);
    } catch (error) {
      console.error('Failed to crossfade:', error);
      onError('Failed to transition between tracks. Please try again.');
      return source;
    }
  }, [ensureAudioContext, crossfade, onError]);

  return {
    ensureAudioContext,
    initializeAudioSource,
    crossfade: crossfadeToTrack,
    setVolume,
    fadeOut,
    fadeIn,
    cleanup
  };
}

// Re-export AudioSource type for convenience
export type { AudioSource } from '../../hooks/playback/useSourceNodes';
