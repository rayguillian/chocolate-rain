import { useRef, useCallback } from 'react';

interface UseAudioContextResult {
  ensureAudioContext: () => Promise<boolean>;
  getAudioContext: () => AudioContext | undefined;
  cleanup: () => void;
}

export function useAudioContext(onError: (error: string) => void): UseAudioContextResult {
  const audioContextRef = useRef<AudioContext>();

  const ensureAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      onError('Failed to initialize audio. Please check your browser settings.');
      return false;
    }
  }, [onError]);

  const getAudioContext = useCallback(() => {
    return audioContextRef.current;
  }, []);

  const cleanup = useCallback(() => {
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close().catch(err => {
        console.error('Error closing audio context:', err);
      });
    }
  }, []);

  return {
    ensureAudioContext,
    getAudioContext,
    cleanup
  };
}
