import React, { useRef } from 'react';
import { PlayCircle, PauseCircle, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { AudioTrack, AudioState } from '../../types/audio';
import { useAudioEngine, AudioSource } from './AudioEngine';
import { usePlaybackControl } from '../../hooks/playback/usePlaybackControl';
import { useAudioEvents } from '../../hooks/playback/useAudioEvents';
import { audioCache } from '../../utils/audio-cache';

interface AudioTrackControllerProps {
  title: string;
  tracks: AudioTrack[];
  audioState: AudioState;
  onStateChange: (newState: AudioState) => void;
  onError: (error: string) => void;
}

export const AudioTrackController: React.FC<AudioTrackControllerProps> = ({
  title,
  tracks,
  audioState,
  onStateChange,
  onError,
}) => {
  const controllerRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioSource>();

  const {
    ensureAudioContext,
    initializeAudioSource,
    crossfade,
    setVolume,
    cleanup
  } = useAudioEngine({ onError });

  const { togglePlayback } = usePlaybackControl({
    ensureAudioContext,
    initializeAudioSource,
    setVolume,
    onError
  });

  useAudioEvents({
    audioSourceRef,
    audioState,
    tracks,
    onStateChange,
    onError,
    crossfade,
    setVolume
  });

  return (
    <div 
      ref={controllerRef}
      data-controller={title.toLowerCase().replace(/\s+/g, '-')}
      className="group"
    >
      <div className="space-y-2">
        <Button
          variant="ghost"
          className="w-full h-24 border border-white/10 hover:border-white/20 bg-black hover:bg-black/90 transition-all duration-300"
          onClick={() => togglePlayback(audioSourceRef, tracks, audioState, onStateChange)}
          disabled={!audioCache.isFullyLoaded()}
        >
          <div className="flex flex-col items-center space-y-2">
            {audioState.isPlaying ? (
              <PauseCircle className="w-6 h-6 text-white/80" />
            ) : (
              <PlayCircle className="w-6 h-6 text-white/80" />
            )}
            <span className="text-white/60 font-light tracking-wider text-xs uppercase">
              {title === 'brown-noise-stream' ? 'Brown Noise' : 'Rain'}
            </span>
          </div>
        </Button>
        <div className="flex items-center space-x-2 px-4 py-2">
          <Volume2 className="w-4 h-4 text-white/60" />
          <input
            type="range"
            min="0"
            max="100"
            value={audioState.volume}
            onChange={(e) => onStateChange({ ...audioState, volume: Number(e.target.value) })}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/80"
          />
        </div>
      </div>
    </div>
  );
};
