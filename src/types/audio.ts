export interface AudioTrack {
  url: string;
  title: string;
  artist: string;
  category: string;
  fullPath: string;
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  currentTrackIndex: number;
}
