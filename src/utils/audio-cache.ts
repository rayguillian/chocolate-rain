import { AudioTrack } from '../types/audio';

interface CacheEntry {
  url: string;
  title: string;
  artist: string;
  category: string;
  fullPath: string;
}

interface AudioCacheStatus {
  isLoading: boolean;
  error: string | null;
  progress: number;
}

const REQUIRED_TRACKS_PER_CATEGORY = 2;

class AudioCache {
  private cache: Map<string, HTMLAudioElement>;
  private loadingStatus: Map<string, AudioCacheStatus>;
  private categoryLoadedCount: Map<string, number>;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.cache = new Map();
    this.loadingStatus = new Map();
    this.categoryLoadedCount = new Map();
  }

  private async preloadAudio(track: CacheEntry, retryCount = 0): Promise<HTMLAudioElement> {
    const audio = new Audio();
    
    try {
      await new Promise((resolve, reject) => {
        const onCanPlayThrough = () => {
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('error', onError);
          resolve(audio);
        };

        const onError = (error: ErrorEvent) => {
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('error', onError);
          reject(error);
        };

        audio.addEventListener('canplaythrough', onCanPlayThrough);
        audio.addEventListener('error', onError);
        audio.preload = 'auto';
        audio.src = track.url;
        audio.load();
      });

      return audio;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.preloadAudio(track, retryCount + 1);
      }
      throw error;
    }
  }

  private async loadTrack(track: AudioTrack): Promise<void> {
    this.loadingStatus.set(track.fullPath, {
      isLoading: true,
      error: null,
      progress: 0
    });

    try {
      const audio = await this.preloadAudio(track);
      this.cache.set(track.fullPath, audio);
      this.loadingStatus.set(track.fullPath, {
        isLoading: false,
        error: null,
        progress: 100
      });
    } catch (error) {
      console.error(`Failed to preload track ${track.title}:`, error);
      this.loadingStatus.set(track.fullPath, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load audio',
        progress: 0
      });
      throw error;
    }
  }

  async init(tracks: AudioTrack[]): Promise<void> {
    this.clearCache();
    
    // Group tracks by category
    const tracksByCategory = new Map<string, AudioTrack[]>();
    tracks.forEach(track => {
      const categoryTracks = tracksByCategory.get(track.category) || [];
      categoryTracks.push(track);
      tracksByCategory.set(track.category, categoryTracks);
    });

    // Initialize category counts
    this.categoryLoadedCount.clear();
    tracksByCategory.forEach((_, category) => {
      this.categoryLoadedCount.set(category, 0);
    });

    // Load first 3 tracks from each category with high priority
    const priorityLoadPromises: Promise<void>[] = [];
    const backgroundLoadPromises: Promise<void>[] = [];

    tracksByCategory.forEach((categoryTracks, category) => {
      categoryTracks.forEach((track, index) => {
        const loadPromise = this.loadTrack(track).then(() => {
          const currentCount = this.categoryLoadedCount.get(category) || 0;
          this.categoryLoadedCount.set(category, currentCount + 1);
        });

        if (index < REQUIRED_TRACKS_PER_CATEGORY) {
          priorityLoadPromises.push(loadPromise);
        } else {
          backgroundLoadPromises.push(loadPromise);
        }
      });
    });

    // Wait for priority tracks to load
    await Promise.all(priorityLoadPromises);

    // Load remaining tracks in the background
    backgroundLoadPromises.forEach(promise => {
      promise.catch(error => {
        console.error('Background track load failed:', error);
      });
    });
  }

  async loadAudioWithCache(track: CacheEntry): Promise<HTMLAudioElement> {
    const cacheKey = track.fullPath;
    
    if (this.cache.has(cacheKey)) {
      const audio = this.cache.get(cacheKey)!;
      
      // If audio is not ready, wait for it
      if (audio.readyState < 4) {
        await new Promise((resolve, reject) => {
          const onCanPlayThrough = () => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            resolve(audio);
          };

          const onError = (error: ErrorEvent) => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            reject(error);
          };

          audio.addEventListener('canplaythrough', onCanPlayThrough);
          audio.addEventListener('error', onError);
        });
      }
      
      return audio;
    }

    // If not in cache, preload it
    const audio = await this.preloadAudio(track);
    this.cache.set(cacheKey, audio);
    return audio;
  }

  getLoadingStatus(track: AudioTrack): AudioCacheStatus {
    return (
      this.loadingStatus.get(track.fullPath) || {
        isLoading: false,
        error: null,
        progress: 0
      }
    );
  }

  isFullyLoaded(): boolean {
    // Check if each category has at least REQUIRED_TRACKS_PER_CATEGORY tracks loaded
    for (const [_, count] of this.categoryLoadedCount) {
      if (count < REQUIRED_TRACKS_PER_CATEGORY) {
        return false;
      }
    }
    return true;
  }

  clearCache(): void {
    this.cache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.cache.clear();
    this.loadingStatus.clear();
    this.categoryLoadedCount.clear();
  }
}

export const audioCache = new AudioCache();
