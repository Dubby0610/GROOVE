import { useRef, useCallback, useState, useEffect } from 'react';

interface UseBackgroundMusicReturn {
  playBackgroundMusic: () => Promise<void>;
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
    isPlaying: false,
    volume: 0.4, // Lower volume for background music
    duration: 0
  });

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      console.log('Creating new audio element with file:', audioFile);
      audioRef.current = new Audio(audioFile);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.4;
      audioRef.current.loop = true; // Loop background music
      
      // Set up audio event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata loaded, duration:', audioRef.current?.duration);
        setAudioState(prev => ({
          ...prev,
          isLoaded: true,
          duration: audioRef.current?.duration || 0
        }));
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
        console.log('Audio play event fired');
        setAudioState(prev => ({ ...prev, isPlaying: true }));
        isPlayingRef.current = true;
      });

      audioRef.current.addEventListener('pause', () => {
        console.log('Audio pause event fired');
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
    if (!audioRef.current) {
      console.log('Audio ref not available');
      return Promise.resolve();
    }

    console.log('Audio element found, attempting to play...');
    console.log('Audio readyState:', audioRef.current.readyState);
    console.log('Audio src:', audioRef.current.src);
    
    // Wait for audio to be ready if it's not already
    if (audioRef.current.readyState < 2) {
      console.log('Audio not ready, waiting for canplay...');
      return new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplay', handleCanPlay);
            audioRef.current.removeEventListener('error', handleError);
            
            audioRef.current.currentTime = 0;
            audioRef.current.volume = audioState.volume;
            
            audioRef.current.play().then(() => {
              console.log('Audio play() succeeded after waiting');
              setAudioState(prev => ({ ...prev, isPlaying: true }));
              isPlayingRef.current = true;
              resolve();
            }).catch(reject);
          }
        };
        
        const handleError = (e: Event) => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplay', handleCanPlay);
            audioRef.current.removeEventListener('error', handleError);
          }
          reject(e);
        };
        
        if (audioRef.current) {
          audioRef.current.addEventListener('canplay', handleCanPlay);
          audioRef.current.addEventListener('error', handleError);
        }
      });
    }
    
    audioRef.current.currentTime = 0;
    audioRef.current.volume = audioState.volume;
    
    return audioRef.current.play().then(() => {
      console.log('Audio play() succeeded');
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to play background music:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
      throw error; // Re-throw to allow caller to handle
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
