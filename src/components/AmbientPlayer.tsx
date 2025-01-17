import React, { useEffect, useRef } from 'react';
import { useTrackManager } from '../hooks/useTrackManager';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { PlayerLayout } from './ui/PlayerLayout';

interface AmbientPlayerProps {
  onInitialized: () => void;
}

const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ onInitialized }) => {
  const [
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
      shuffleTracks,
      retryInitialization
    }
  ] = useTrackManager();

  const hasStartedInitRef = useRef(false);

  useEffect(() => {
    if (!hasStartedInitRef.current) {
      hasStartedInitRef.current = true;
      retryInitialization();
    }
  }, [retryInitialization]);

  useEffect(() => {
    if (isInitialized) {
      onInitialized();
    }
  }, [isInitialized, onInitialized]);

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={retryInitialization} 
      />
    );
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <PlayerLayout
      brownNoiseState={brownNoiseState}
      rainState={rainState}
      brownNoiseTracks={brownNoiseTracks}
      rainTracks={rainTracks}
      isShuffling={isShuffling}
      onBrownNoiseStateChange={setBrownNoiseState}
      onRainStateChange={setRainState}
      onShuffle={shuffleTracks}
      onError={error => console.error(error)}
    />
  );
};

export default AmbientPlayer;
