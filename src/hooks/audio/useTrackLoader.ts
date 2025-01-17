import { useCallback } from 'react';
import { AudioTrack } from '../../types/audio';
import { listTracksFromFolder } from '../../utils/storage-utils';
import { audioCache } from '../../utils/audio-cache';

interface UseTrackLoaderResult {
  loadTracks: () => Promise<{
    brownNoise: AudioTrack[];
    rain: AudioTrack[];
  }>;
  initializeAudioCache: (tracks: AudioTrack[]) => Promise<void>;
  isFullyLoaded: () => boolean;
}

export function useTrackLoader(): UseTrackLoaderResult {
  const loadTracks = useCallback(async () => {
    try {
      const [brownNoise, rain] = await Promise.all([
        listTracksFromFolder('Brown Noise Stream'),
        listTracksFromFolder('Rain Makes Everything Better')
      ]);
      
      if (!brownNoise.length && !rain.length) {
        throw new Error('No audio tracks found in either category');
      }
      
      return { brownNoise, rain };
    } catch (err) {
      console.error('Failed to load tracks:', err);
      throw new Error('Failed to load audio tracks');
    }
  }, []);

  const initializeAudioCache = async (tracks: AudioTrack[]) => {
    try {
      await audioCache.init(tracks);
    } catch (err) {
      console.error('Failed to initialize audio cache:', err);
      throw new Error('Failed to initialize audio cache');
    }
  };

  const isFullyLoaded = () => {
    return audioCache.isFullyLoaded();
  };

  return {
    loadTracks,
    initializeAudioCache,
    isFullyLoaded
  };
}
