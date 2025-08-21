import { useRef, useCallback, useState } from 'react';

interface UseElevatorAudioReturn {
  playElevatorSound: (animationDuration: number) => void;
  stopElevatorSound: () => void;
  isPlaying: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  audioState: {
    isLoaded: boolean;
    isPlaying: boolean;
    volume: number;
    duration: number;
  };
}

export const useElevatorAudio = (): UseElevatorAudioReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [audioState, setAudioState] = useState({
    isLoaded: false,
    isPlaying: false,
    volume: 0.6,
    duration: 30
  });

  // Initialize audio element
  if (!audioRef.current) {
    audioRef.current = new Audio('/sounds/elevator_ride.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.6;
    
    // Set up audio event listeners
    audioRef.current.addEventListener('loadedmetadata', () => {
      setAudioState(prev => ({
        ...prev,
        isLoaded: true,
        duration: audioRef.current?.duration || 30
      }));
    });

    audioRef.current.addEventListener('ended', () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });

    audioRef.current.addEventListener('error', (e) => {
      console.error('Elevator audio error:', e);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });
  }

  const playElevatorSound = useCallback((animationDuration: number) => {
    if (!audioRef.current) return;

    // Reset audio state
    audioRef.current.currentTime = 0;
    audioRef.current.volume = audioState.volume;
    
    // Start playing
    audioRef.current.play().then(() => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to play elevator sound:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });

    // Calculate when to stop based on animation duration
    // The sound is 30 seconds, but animation might be shorter
    const stopTime = Math.min(animationDuration, 30);
    
    // Set up automatic stop when animation completes
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }
    
    stopTimeoutRef.current = setTimeout(() => {
      stopElevatorSound();
    }, stopTime * 1000);
  }, [audioState.volume]);

  const stopElevatorSound = useCallback(() => {
    if (!audioRef.current) return;

    // Clear the stop timeout
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // Fade out the audio smoothly
    const fadeOutDuration = 500; // 500ms fade out
    const fadeOutSteps = 20;
    const fadeOutInterval = fadeOutDuration / fadeOutSteps;
    const volumeStep = audioRef.current.volume / fadeOutSteps;

    const fadeOut = setInterval(() => {
      if (audioRef.current && audioRef.current.volume > volumeStep) {
        audioRef.current.volume -= volumeStep;
      } else {
        clearInterval(fadeOut);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.volume = audioState.volume; // Reset to current volume setting
        }
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
      }
    }, fadeOutInterval);
  }, [audioState.volume]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const getVolume = useCallback(() => {
    return audioState.volume;
  }, [audioState.volume]);

  const isPlaying = useCallback(() => {
    return isPlayingRef.current;
  }, []);

  return {
    playElevatorSound,
    stopElevatorSound,
    isPlaying,
    setVolume,
    getVolume,
    audioState
  };
};
