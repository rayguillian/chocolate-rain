import { useCallback } from 'react';
import { AudioTrack } from '../../types/audio';
import { audioCache } from '../../utils/audio-cache';
import { AudioSource } from './useSourceNodes';
import { FADE_IN_DURATION, FADE_OUT_DURATION } from '../../config/ambient-player-config';

interface UseCrossfadeProps {
  getAudioContext: () => AudioContext | undefined;
  getOrCreateSourceNode: (audio: HTMLAudioElement) => MediaElementAudioSourceNode;
}

export function useCrossfade({
  getAudioContext,
  getOrCreateSourceNode
}: UseCrossfadeProps) {
  const crossfade = useCallback(async (
    source: AudioSource,
    nextTrack: AudioTrack,
    volume: number
  ): Promise<AudioSource> => {
    const context = getAudioContext();
    if (!context) return source;

    try {
      // Load and prepare next audio
      const nextAudio = await audioCache.loadAudioWithCache({
        url: nextTrack.url,
        title: nextTrack.title,
        artist: nextTrack.artist,
        category: nextTrack.category,
        fullPath: nextTrack.fullPath
      });
      nextAudio.loop = true;
      nextAudio.crossOrigin = "anonymous";
      
      // Get or create source node for next audio
      const nextSourceNode = getOrCreateSourceNode(nextAudio);
      const nextGainNode = context.createGain();
      nextSourceNode.connect(nextGainNode);
      nextGainNode.connect(context.destination);
      
      // Initialize gain to 0 for fade in
      nextGainNode.gain.setValueAtTime(0, context.currentTime);
      
      const currentTime = context.currentTime;

      // If fading to silence (volume = 0), only fade out current track
      if (volume === 0) {
        if (!source.audio.paused) {
          source.gainNode.gain.setValueAtTime(source.gainNode.gain.value, currentTime);
          source.gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_OUT_DURATION / 1000);
        }
        await nextAudio.pause();
        return source;
      }

      // If current source is paused and we're fading in
      if (source.audio.paused) {
        // Start playing the next track silently
        await nextAudio.play();
        nextGainNode.gain.setValueAtTime(0, currentTime);
        nextGainNode.gain.linearRampToValueAtTime(volume / 100, currentTime + FADE_IN_DURATION / 1000);
        
        return {
          audio: nextAudio,
          sourceNode: nextSourceNode,
          gainNode: nextGainNode,
          track: nextTrack
        };
      }

      // Regular crossfade between two playing tracks
      await nextAudio.play();
      
      // Keep current track playing during fade out
      source.gainNode.gain.setValueAtTime(source.gainNode.gain.value, currentTime);
      source.gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_OUT_DURATION / 1000);
      
      // Fade in next track
      nextGainNode.gain.setValueAtTime(0, currentTime);
      nextGainNode.gain.linearRampToValueAtTime(volume / 100, currentTime + FADE_IN_DURATION / 1000);
      
      // Schedule cleanup after fade
      setTimeout(async () => {
        try {
          if (source.audio.paused) {
            source.gainNode.disconnect();
            if (source.nextGainNode) source.nextGainNode.disconnect();
          } else {
            await source.audio.pause();
            source.gainNode.disconnect();
            if (source.nextGainNode) source.nextGainNode.disconnect();
          }
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }, Math.max(FADE_OUT_DURATION, FADE_IN_DURATION)); // Wait for fade to complete

      return {
        audio: nextAudio,
        sourceNode: nextSourceNode,
        gainNode: nextGainNode,
        track: nextTrack
      };
    } catch (error) {
      console.error('Error during crossfade:', error);
      return source;
    }
  }, [getAudioContext, getOrCreateSourceNode]);

  return {
    crossfade
  };
}
