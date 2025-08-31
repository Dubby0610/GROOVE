import { useRef, useCallback, useState, useEffect } from 'react';

interface UseNightclubMusicReturn {
  playDanceMusic: () => void;
  stopDanceMusic: () => void;
  pauseDanceMusic: () => void;
  resumeDanceMusic: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isPlaying: () => boolean;
  toggleMusic: () => void;
  seekTo: (timeInSeconds: number) => void;
  getAudioLevels: () => number[];
  resetAudioElement: () => HTMLAudioElement | null;
  audioState: {
    isLoaded: boolean;
    isPlaying: boolean;
    volume: number;
    duration: number;
    currentTime: number;
  };
}

export const useNightclubMusic = (audioFile: string): UseNightclubMusicReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  
  const [audioState, setAudioState] = useState({
    isLoaded: false,
    isPlaying: false,
    volume: 0.7,
    duration: 0,
    currentTime: 0
  });

  // Simple audio levels for visualization
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(9).fill(0));

  // BULLETPROOF PROGRESS TRACKING
  const startProgressTracking = useCallback(() => {
    if (progressTimerRef.current) return; // Already running
    
    console.log('🚀 Starting bulletproof progress tracking');
    
    progressTimerRef.current = window.setInterval(() => {
      if (audioRef.current && isPlayingRef.current && !audioRef.current.paused) {
        const newCurrentTime = audioRef.current.currentTime;
        const newDuration = audioRef.current.duration || 0;
        
        // Update refs for immediate access
        currentTimeRef.current = newCurrentTime;
        durationRef.current = newDuration;
        
        // Update state for UI
          setAudioState(prev => ({
            ...prev,
          currentTime: newCurrentTime,
          duration: newDuration,
          isLoaded: newDuration > 0
        }));
        
        // Debug logging every 5 seconds
        if (Math.floor(newCurrentTime) % 5 === 0) {
          console.log(`⏱️ Progress: ${newCurrentTime.toFixed(1)}s / ${newDuration.toFixed(1)}s`);
        }
      }
    }, 50); // Update every 50ms for super smooth progress
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressTimerRef.current) {
      console.log('⏹️ Stopping progress tracking');
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // Simple visualization animation
  const startVisualization = useCallback(() => {
    if (!isPlayingRef.current) return;
    
    // Generate dynamic audio levels
    const newLevels = Array.from({ length: 9 }, (_, i) => {
      const baseLevel = Math.random() * 0.8;
      const timeOffset = Date.now() * 0.005 + i * 0.5;
      const wave = Math.sin(timeOffset) * 0.3 + 0.5;
      return Math.max(0.1, Math.min(1, baseLevel * wave));
    });
    
    setAudioLevels(newLevels);
    
    // Continue animation if still playing
    if (isPlayingRef.current) {
      setTimeout(startVisualization, 60); // ~16fps for smooth animation
    }
  }, []);

  const stopVisualization = useCallback(() => {
    setAudioLevels(new Array(9).fill(0));
  }, []);

  // Initialize audio element
  useEffect(() => {
    console.log('🎵 useNightclubMusic useEffect triggered with audioFile:', audioFile);
    
    if (audioRef.current) {
      console.log('🎵 Audio already initialized, skipping');
      return; // Already initialized
    }
    
    console.log('🎵 Initializing nightclub BACKGROUND audio for:', audioFile);
    
    let audio: HTMLAudioElement;
    
    try {
      audio = new Audio(audioFile);
      audio.preload = 'auto'; // Load full audio for immediate playback
      audio.volume = 0.7;
      audio.loop = true; // CRITICAL: Must loop for background music
      audio.crossOrigin = 'anonymous';
      audio.autoplay = false; // We'll manually trigger play
      audioRef.current = audio;
      
      console.log('✅ Audio element created successfully');
    } catch (error) {
      console.error('❌ Failed to create Audio element:', error);
      return;
    }

    console.log('📂 Audio file path:', audioFile);
    console.log('🔧 Audio element created with properties:');
    console.log('   - Volume:', audio.volume);
    console.log('   - Loop:', audio.loop);
    console.log('   - Preload:', audio.preload);
    console.log('   - Autoplay:', audio.autoplay);

    // Event handlers
    const onLoadedMetadata = () => {
      const duration = audio.duration || 0;
      console.log('📊 Nightclub metadata loaded:');
      console.log('   - Duration:', duration);
      console.log('   - Ready state:', audio.readyState);
      console.log('   - Network state:', audio.networkState);
      console.log('   - Audio src:', audio.src);
      console.log('   - Audio currentSrc:', audio.currentSrc);
      
      durationRef.current = duration;
      setAudioState(prev => ({
        ...prev,
        duration: duration,
        isLoaded: duration > 0
      }));
    };

    const onCanPlay = () => {
      console.log('🎵 Audio can play - ready for playback');
      console.log('   - Ready state:', audio.readyState);
      console.log('   - Network state:', audio.networkState);
    };

    const onCanPlayThrough = () => {
      console.log('🎵 Audio can play through - fully loaded');
      console.log('   - Ready state:', audio.readyState);
      console.log('   - Network state:', audio.networkState);
    };

    const onLoadStart = () => {
      console.log('🔄 Audio load started');
    };

    const onProgress = () => {
      console.log('📈 Audio loading progress');
    };

    const onSuspend = () => {
      console.log('⏸️ Audio loading suspended');
    };

    const onAbort = () => {
      console.log('🚫 Audio loading aborted');
    };

    const onTimeUpdate = () => {
      // Always update time and duration when available
      const currentTime = audio.currentTime;
      const newDuration = audio.duration || 0;
      
      // Update refs for immediate access
      currentTimeRef.current = currentTime;
      durationRef.current = newDuration;
      
      // Update state for UI - always update, not just when playing
      setAudioState(prev => ({
        ...prev,
        currentTime: currentTime,
        duration: newDuration,
        isLoaded: newDuration > 0,
        // Also check if actually playing
        isPlaying: !audio.paused && !audio.ended
      }));
      
      // Debug logging every 5 seconds
      if (Math.floor(currentTime) % 5 === 0) {
        console.log(`⏱️ Progress: ${currentTime.toFixed(1)}s / ${newDuration.toFixed(1)}s, Playing: ${!audio.paused}`);
      }
    };

    const onPlay = () => {
      console.log('▶️ Audio PLAY event');
      isPlayingRef.current = true;
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      startProgressTracking();
      startVisualization();
    };

    const onPause = () => {
      console.log('⏸️ Audio PAUSE event');
      isPlayingRef.current = false;
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      // Don't stop progress tracking - keep it running for accurate state
    };

    const onEnded = () => {
      console.log('🔄 Audio ENDED - Looping');
      if (audio.loop) {
        audio.currentTime = 0;
        currentTimeRef.current = 0;
        setAudioState(prev => ({ ...prev, currentTime: 0 }));
      }
    };

    const onError = (e: Event) => {
      console.error('❌ Nightclub audio ERROR:');
      console.error('   - Event:', e);
      console.error('   - Audio src:', audio.src);
      console.error('   - Audio error:', audio.error);
      console.error('   - Network state:', audio.networkState);
      console.error('   - Ready state:', audio.readyState);
      
      isPlayingRef.current = false;
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      stopProgressTracking();
    };

    // Attach all event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('progress', onProgress);
    audio.addEventListener('suspend', onSuspend);
    audio.addEventListener('abort', onAbort);

    // Force load metadata
    audio.load();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up audio');
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('suspend', onSuspend);
      audio.removeEventListener('abort', onAbort);
      
      stopProgressTracking();
      stopVisualization();
      
      audio.pause();
      audio.src = '';
    };
  }, [audioFile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      stopVisualization();
    };
  }, [stopProgressTracking, stopVisualization]);

  // Periodic state sync to ensure UI stays in sync with audio
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (audioRef.current) {
        const audio = audioRef.current;
        const isActuallyPlaying = !audio.paused && !audio.ended;
        
        // Sync playing state
        if (isActuallyPlaying !== audioState.isPlaying) {
          console.log(`🔄 Syncing playing state: ${audioState.isPlaying} → ${isActuallyPlaying}`);
          setAudioState(prev => ({ ...prev, isPlaying: isActuallyPlaying }));
          isPlayingRef.current = isActuallyPlaying;
        }
        
        // Sync time and duration
        const currentTime = audio.currentTime;
        const duration = audio.duration || 0;
        
        if (Math.abs(currentTime - audioState.currentTime) > 0.1 || Math.abs(duration - audioState.duration) > 0.1) {
          setAudioState(prev => ({
            ...prev,
            currentTime: currentTime,
            duration: duration,
            isLoaded: duration > 0
          }));
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(syncInterval);
  }, [audioState.isPlaying, audioState.currentTime, audioState.duration]);

    // NIGHTCLUB BACKGROUND MUSIC - AUTO START
  const playDanceMusic = useCallback(() => {
    console.log('🎵 playDanceMusic() called');
    
    if (!audioRef.current) {
      console.error('❌ Nightclub audio not initialized - audioRef.current is null');
      return;
    }

    console.log('🎵 STARTING nightclub background music...');
    console.log('🔍 Audio element details:');
    console.log('   - src:', audioRef.current.src);
    console.log('   - readyState:', audioRef.current.readyState);
    console.log('   - networkState:', audioRef.current.networkState);
    console.log('   - paused:', audioRef.current.paused);
    console.log('   - ended:', audioRef.current.ended);
    
    const audio = audioRef.current;
    
    // Setup for background music
    audio.currentTime = 0;
    audio.volume = audioState.volume;
    audio.loop = true; // Critical for background music
    
    currentTimeRef.current = 0;
    setAudioState(prev => ({ ...prev, currentTime: 0 }));
    
    console.log('🚀 Playing nightclub music automatically...');
    console.log('🔧 Final audio properties:');
    console.log('   - Volume:', audio.volume);
    console.log('   - Loop:', audio.loop);
    console.log('   - Current time:', audio.currentTime);
    
    // IMPORTANT: Use the hook's managed audio element so event listeners work
    audio.play()
      .then(() => {
        console.log('✅ NIGHTCLUB MUSIC PLAYING!');
        // The onPlay event listener will handle state updates
        // But also update immediately for responsiveness
        isPlayingRef.current = true;
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      })
      .catch((error) => {
        console.error('❌ Nightclub music autoplay FAILED:', error);
        console.error('   - Error name:', error.name);
        console.error('   - Error message:', error.message);
        isPlayingRef.current = false;
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      });
  }, [audioState.volume]);

  const stopDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    console.log('⏹️ STOP - Reset to beginning');
    
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    
    isPlayingRef.current = false;
    currentTimeRef.current = 0;
    
    setAudioState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0
    }));
    
    stopProgressTracking();
    stopVisualization();
  }, [stopProgressTracking, stopVisualization]);

  const pauseDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    console.log('⏸️ PAUSE - Keep position');

    audioRef.current.pause();
    isPlayingRef.current = false;
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    // Keep progress tracking running to maintain state
  }, []);

  const resumeDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    console.log('▶️ RESUME - Continue from current position');
    
    audioRef.current.play()
      .then(() => {
        console.log('✅ Resume successful');
        isPlayingRef.current = true;
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      })
      .catch((error) => {
        console.error('❌ Resume failed:', error);
        isPlayingRef.current = false;
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      });
  }, []);

  const toggleMusic = useCallback(() => {
    console.log('🔄 TOGGLE - Current state:', isPlayingRef.current ? 'PLAYING' : 'PAUSED');
    
    if (isPlayingRef.current) {
      pauseDanceMusic();
    } else {
      resumeDanceMusic();
    }
  }, [pauseDanceMusic, resumeDanceMusic]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const getVolume = useCallback(() => {
    return audioState.volume;
  }, []);

  const isPlaying = useCallback(() => {
    return isPlayingRef.current;
  }, []);

  const seekTo = useCallback((timeInSeconds: number) => {
    if (!audioRef.current || !durationRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(timeInSeconds, durationRef.current));
    
    console.log(`🎯 SEEK to ${clampedTime.toFixed(1)}s`);
    
    audioRef.current.currentTime = clampedTime;
    currentTimeRef.current = clampedTime;
    
    setAudioState(prev => ({
      ...prev,
      currentTime: clampedTime
    }));
  }, []);

  const getAudioLevels = useCallback(() => {
    return audioLevels;
  }, [audioLevels]);

  const resetAudioElement = useCallback(() => {
    console.log('🔄 Force resetting audio element...');
    
    if (audioRef.current) {
      const currentAudio = audioRef.current;
      currentAudio.pause();
      currentAudio.src = '';
      audioRef.current = null;
    }
    
    // Force reinitialization with correct source
    const audio = new Audio('/sounds/floor_1_1.mp3');
    audio.preload = 'auto';
    audio.volume = 0.7;
    audio.loop = true;
    audio.crossOrigin = 'anonymous';
    audio.autoplay = false;
    
    audioRef.current = audio;
    
    console.log('✅ Audio element reset with correct source:', audio.src);
    
    // Reattach basic event listeners
    const onLoadedMetadata = () => {
      const duration = audio.duration || 0;
      console.log('📊 Reset audio metadata loaded:', duration);
      durationRef.current = duration;
      setAudioState(prev => ({
        ...prev,
        duration: duration,
        isLoaded: duration > 0
      }));
    };
    
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.load();
    
    return audio;
  }, []);

  return {
    playDanceMusic,
    stopDanceMusic,
    pauseDanceMusic,
    resumeDanceMusic,
    setVolume,
    getVolume,
    isPlaying,
    toggleMusic,
    seekTo,
    getAudioLevels,
    resetAudioElement,
    audioState
  };
};
