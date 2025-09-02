import { useRef, useCallback, useState, useEffect } from 'react';

interface UseBackgroundMusicReturn {
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  resumeBackgroundMusic: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isPlaying: () => boolean;
  audioState: {
    isLoaded: boolean;
    isPlaying: boolean;
    volume: number;
    duration: number;
  };
}

export const useBackgroundMusic = (audioFile: string): UseBackgroundMusicReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(true);
  
  const [audioState, setAudioState] = useState({
    isLoaded: true,
    isPlaying: true,
    volume: 0.4, // Lower volume for background music
    duration: 0
  });

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioFile);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.4;
      audioRef.current.loop = true; // Loop background music
      
      // Set up audio event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        setAudioState(prev => ({
          ...prev,
          isLoaded: true,
          duration: audioRef.current?.duration || 0
        }));
        
        // Auto-play when loaded (with user interaction)
        if (document.readyState === 'complete') {
          audioRef.current?.play().catch(console.error);
        }
      });

      // Also try to play when the audio can play through
      audioRef.current.addEventListener('canplaythrough', () => {
        // Only auto-play if not already playing
        if (!isPlayingRef.current && document.readyState === 'complete') {
          audioRef.current?.play().catch(console.error);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        // For looped audio, this won't fire, but just in case
        if (audioRef.current && audioRef.current.loop) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('Background music error:', e);
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
      });

      audioRef.current.addEventListener('play', () => {
        setAudioState(prev => ({ ...prev, isPlaying: true }));
        isPlayingRef.current = true;
      });

      audioRef.current.addEventListener('pause', () => {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
      });

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Page is hidden, pause audio
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
        } else {
          // Page is visible, resume audio if it was playing
          if (audioRef.current && isPlayingRef.current) {
            audioRef.current.play().catch(console.error);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [audioFile]);

  const playBackgroundMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.volume = audioState.volume;
    
    audioRef.current.play().then(() => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to play background music:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });
  }, [audioState.volume]);

  const stopBackgroundMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    isPlayingRef.current = false;
  }, []);

  const pauseBackgroundMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    isPlayingRef.current = false;
  }, []);

  const resumeBackgroundMusic = useCallback(() => {
    if (!audioRef.current) return;

    // Ensure volume is set correctly
    audioRef.current.volume = audioState.volume;
    
    audioRef.current.play().then(() => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to resume background music:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
      
      // Try again after a short delay if it failed
      setTimeout(() => {
        if (audioRef.current && !isPlayingRef.current) {
          audioRef.current.play().catch(console.error);
        }
      }, 500);
    });
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
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    setVolume,
    getVolume,
    isPlaying,
    audioState
  };
};