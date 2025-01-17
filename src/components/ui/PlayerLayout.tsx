import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './card';
import { Separator } from './separator';
import { AudioTrackController } from '../audio/AudioTrackController';
import { ShuffleButton } from './ShuffleButton';
import { AudioState, AudioTrack } from '../../types/audio';
import { CALMING_PHRASES, PHRASE_CHANGE_INTERVAL, PHRASE_FADE_DURATION, PLAYER_STYLES } from '../../config/ambient-player-config';

interface PlayerLayoutProps {
  brownNoiseState: AudioState;
  rainState: AudioState;
  brownNoiseTracks: AudioTrack[];
  rainTracks: AudioTrack[];
  isShuffling: boolean;
  onBrownNoiseStateChange: (state: AudioState) => void;
  onRainStateChange: (state: AudioState) => void;
  onShuffle: () => void;
  onError: (error: string) => void;
}

export const PlayerLayout: React.FC<PlayerLayoutProps> = ({
  brownNoiseState,
  rainState,
  brownNoiseTracks,
  rainTracks,
  isShuffling,
  onBrownNoiseStateChange,
  onRainStateChange,
  onShuffle,
  onError
}) => {
  const [currentPhrase, setCurrentPhrase] = useState(() => 
    CALMING_PHRASES[Math.floor(Math.random() * CALMING_PHRASES.length)]
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPhrase(CALMING_PHRASES[Math.floor(Math.random() * CALMING_PHRASES.length)]);
        setIsVisible(true);
      }, PHRASE_FADE_DURATION);
    }, PHRASE_CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={PLAYER_STYLES.container}>
      <Card className={PLAYER_STYLES.card}>
        <CardContent className={PLAYER_STYLES.cardContent}>
          <div className="text-center mb-8">
            <p className={`${PLAYER_STYLES.phraseText} transition-all duration-1000 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              {currentPhrase}
            </p>
          </div>

          <div className="space-y-8">
            <AudioTrackController
              title="brown-noise-stream"
              tracks={brownNoiseTracks}
              audioState={brownNoiseState}
              onStateChange={onBrownNoiseStateChange}
              onError={onError}
            />

            <Separator className={PLAYER_STYLES.separator} />

            <AudioTrackController
              title="rain-makes-everything-better"
              tracks={rainTracks}
              audioState={rainState}
              onStateChange={onRainStateChange}
              onError={onError}
            />
          </div>

          <ShuffleButton 
            isShuffling={isShuffling} 
            onShuffle={onShuffle} 
          />

          <div className="mt-6 text-center">
            <p className={PLAYER_STYLES.footerText}>
              find your peace
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
