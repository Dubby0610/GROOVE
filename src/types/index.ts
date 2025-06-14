export type Scene = 'alley' | 'elevator' | 'club-door';

export interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  volume: number;
}

export interface GameState {
  currentScene: Scene;
  isLoading: boolean;
  hasEnteredClub: boolean;
  guestCount: number;
}

export interface InteractiveElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: () => void;
  hoverText: string;
}