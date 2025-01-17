import { useState } from 'react';
import { AudioState, AudioTrack } from '../../types/audio';

interface TrackState {
  brownNoiseState: AudioState;
  rainState: AudioState;
  brownNoiseTracks: AudioTrack[];
  rainTracks: AudioTrack[];
  isInitialized: boolean;
  isShuffling: boolean;
  error: string | null;
}

interface TrackStateActions {
  setBrownNoiseState: (state: AudioState | ((prev: AudioState) => AudioState)) => void;
  setRainState: (state: AudioState | ((prev: AudioState) => AudioState)) => void;
  setBrownNoiseTracks: (tracks: AudioTrack[] | ((prev: AudioTrack[]) => AudioTrack[])) => void;
  setRainTracks: (tracks: AudioTrack[] | ((prev: AudioTrack[]) => AudioTrack[])) => void;
  setIsInitialized: (initialized: boolean) => void;
  setIsShuffling: (shuffling: boolean) => void;
  setError: (error: string | null) => void;
  resetError: () => void;
}

export function useTrackState(): [TrackState, TrackStateActions] {
  const [isInitialized, setIsInitialized] = useState(false);
  const [brownNoiseState, setBrownNoiseState] = useState<AudioState>({
    isPlaying: false,
    volume: 50,
    currentTrackIndex: 0
  });
  const [rainState, setRainState] = useState<AudioState>({
    isPlaying: false,
    volume: 50,
    currentTrackIndex: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [brownNoiseTracks, setBrownNoiseTracks] = useState<AudioTrack[]>([]);
  const [rainTracks, setRainTracks] = useState<AudioTrack[]>([]);

  const resetError = () => setError(null);

  return [
    {
      brownNoiseState,
      rainState,
      brownNoiseTracks,
      rainTracks,
      isInitialized,
      isShuffling,
      error
    },
    {
      setBrownNoiseState,
      setRainState,
      setBrownNoiseTracks,
      setRainTracks,
      setIsInitialized,
      setIsShuffling,
      setError,
      resetError
    }
  ];
}
