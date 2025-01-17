import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { AudioTrack } from '../types/audio';

const getProxiedUrl = (url: string) => {
  if (import.meta.env.DEV) {
    // Extract the path after 'firebasestorage.googleapis.com' and prefix with '/storage'
    const path = url.split('firebasestorage.googleapis.com')[1];
    return `/storage${path}`;
  }
  return url;
};

const shuffleArray = <T,>(array: T[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const listTracksFromFolder = async (category: string): Promise<AudioTrack[]> => {
  try {
    const folderRef = ref(storage, category);
    const result = await listAll(folderRef);
    
    // Randomly shuffle all items and take first 2
    const shuffledItems = shuffleArray(result.items);
    const limitedItems = shuffledItems.slice(0, 2);
    
    const tracks = await Promise.all(
      limitedItems.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          url: getProxiedUrl(url),
          title: item.name,
          artist: 'Unknown', // Could be extracted from metadata if available
          category,
          fullPath: item.fullPath
        };
      })
    );

    return tracks;
  } catch (error) {
    console.error(`Error listing tracks from ${category}:`, error);
    return [];
  }
};

type StorageChangeCallback = (changes: {
  brownNoise: AudioTrack[];
  rain: AudioTrack[];
}) => void;

// This function now sets up real-time updates for storage changes
export const setupStorageChangeListeners = (callback: StorageChangeCallback): (() => void) => {
  let isListening = true;

  // Poll for changes every 30 seconds
  const interval = setInterval(async () => {
    if (!isListening) return;

    try {
      const [brownNoise, rain] = await Promise.all([
        listTracksFromFolder('Brown Noise Stream'),
        listTracksFromFolder('Rain Makes Everything Better')
      ]);

      callback({ brownNoise, rain });
    } catch (error) {
      console.error('Error checking for storage updates:', error);
    }
  }, 30000);

  // Return cleanup function
  return () => {
    isListening = false;
    clearInterval(interval);
  };
};
