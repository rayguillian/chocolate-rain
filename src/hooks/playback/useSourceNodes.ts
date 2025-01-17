import { useCallback } from 'react';
import { AudioTrack } from '../../types/audio';
import { audioCache } from '../../utils/audio-cache';

// Keep track of source nodes for each audio element
const sourceNodeMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export interface AudioSource {
  audio: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode;
  gainNode: GainNode;
  nextAudio?: HTMLAudioElement;
  nextSourceNode?: MediaElementAudioSourceNode;
  nextGainNode?: GainNode;
  track: AudioTrack;
}

interface UseSourceNodesProps {
  getAudioContext: () => AudioContext | undefined;
}

export function useSourceNodes({ getAudioContext }: UseSourceNodesProps) {
  const getOrCreateSourceNode = useCallback((audio: HTMLAudioElement): MediaElementAudioSourceNode => {
    const context = getAudioContext();
    if (!context) {
      throw new Error('Audio context not initialized');
    }

    let sourceNode = sourceNodeMap.get(audio);
    if (!sourceNode) {
      sourceNode = context.createMediaElementSource(audio);
      sourceNodeMap.set(audio, sourceNode);
    }
    return sourceNode;
  }, [getAudioContext]);

  const initializeAudioSource = useCallback(async (
    track: AudioTrack,
    volume: number
  ): Promise<AudioSource> => {
    const context = getAudioContext();
    if (!context) {
      throw new Error('Audio context not initialized');
    }

    // Load audio with cache support
    const audio = await audioCache.loadAudioWithCache({
      url: track.url,
      title: track.title,
      artist: track.artist,
      category: track.category,
      fullPath: track.fullPath
    });
    audio.loop = true;
    
    // Set up audio element properties
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    
    // Get or create source node for main audio
    const sourceNode = getOrCreateSourceNode(audio);
    const gainNode = context.createGain();
    sourceNode.connect(gainNode);
    gainNode.gain.value = volume / 100;
    gainNode.connect(context.destination);

    // Initialize next audio
    const nextAudio = await audioCache.loadAudioWithCache({
      url: track.url,
      title: track.title,
      artist: track.artist,
      category: track.category,
      fullPath: track.fullPath
    });
    nextAudio.loop = true;
    nextAudio.crossOrigin = "anonymous";
    nextAudio.preload = "auto";
    
    // Get or create source node for next audio
    const nextSourceNode = getOrCreateSourceNode(nextAudio);
    const nextGainNode = context.createGain();
    nextSourceNode.connect(nextGainNode);
    nextGainNode.gain.value = 0;
    nextGainNode.connect(context.destination);

    return {
      audio,
      sourceNode,
      gainNode,
      nextAudio,
      nextSourceNode,
      nextGainNode,
      track
    };
  }, [getAudioContext, getOrCreateSourceNode]);

  return {
    getOrCreateSourceNode,
    initializeAudioSource
  };
}
