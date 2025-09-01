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
  const isPlayingRef = useRef(false);
  
  const [audioState, setAudioState] = useState({
    isLoaded: false,
    isPlaying: false, // Start as false, will be set to true when actually playing
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
      });

      audioRef.current.addEventListener('canplaythrough', () => {
        // Audio is ready to play
        console.log('🎵 Audio ready to play');
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
    audioRef.current.loop = true; // Ensure looping is set
    
    // Check if audio is ready to play
    if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
      // Try to play the audio
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Background music started playing');
          setAudioState(prev => ({ ...prev, isPlaying: true }));
          isPlayingRef.current = true;
        }).catch((error) => {
          console.warn('⚠️ Autoplay blocked by browser, user interaction required:', error);
          setAudioState(prev => ({ ...prev, isPlaying: false }));
          isPlayingRef.current = false;
        });
      }
    } else {
      // Wait for audio to be ready
      const handleCanPlay = () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplay', handleCanPlay);
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('✅ Background music started playing (after loading)');
              setAudioState(prev => ({ ...prev, isPlaying: true }));
              isPlayingRef.current = true;
            }).catch((error) => {
              console.warn('⚠️ Autoplay blocked by browser, user interaction required:', error);
              setAudioState(prev => ({ ...prev, isPlaying: false }));
              isPlayingRef.current = false;
            });
          }
        }
      };
      
      audioRef.current.addEventListener('canplay', handleCanPlay);
    }
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

    audioRef.current.play().then(() => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to resume background music:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });
  }, []);

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
