import { useCallback } from 'react';
import { AudioSource } from './useSourceNodes';

interface UseVolumeControlProps {
  getAudioContext: () => AudioContext | undefined;
  ensureAudioContext: () => Promise<boolean>;
}

export function useVolumeControl({ 
  getAudioContext, 
  ensureAudioContext 
}: UseVolumeControlProps) {
  const setVolume = useCallback(async (
    audioSource: AudioSource | undefined, 
    volume: number
  ) => {
    if (!audioSource) return;
    
    try {
      await ensureAudioContext();
      const context = getAudioContext();
      
      if (context && context.state !== 'closed') {
        const normalizedVolume = volume / 100;
        const currentTime = context.currentTime;
        
        // Smoothly transition to new volume over 50ms to avoid clicks
        audioSource.gainNode.gain.cancelScheduledValues(currentTime);
        audioSource.gainNode.gain.setValueAtTime(
          audioSource.gainNode.gain.value, 
          currentTime
        );
        audioSource.gainNode.gain.linearRampToValueAtTime(
          normalizedVolume, 
          currentTime + 0.05
        );
      }
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }, [getAudioContext, ensureAudioContext]);

  const fadeOut = useCallback((
    gainNode: GainNode | undefined,
    duration: number
  ) => {
    if (!gainNode) return;
    
    const context = getAudioContext();
    if (!context) return;

    const currentTime = context.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);
  }, [getAudioContext]);

  const fadeIn = useCallback((
    gainNode: GainNode | undefined,
    volume: number,
    duration: number
  ) => {
    if (!gainNode) return;
    
    const context = getAudioContext();
    if (!context) return;

    const currentTime = context.currentTime;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume / 100, 
      currentTime + duration / 1000
    );
  }, [getAudioContext]);

  return {
    setVolume,
    fadeOut,
    fadeIn
  };
}
