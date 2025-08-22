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
  getAudioLevels: () => number[];
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  
  const [audioState, setAudioState] = useState({
    isLoaded: false,
    isPlaying: false,
    volume: 0.7, // Higher volume for dance music
    duration: 0,
    currentTime: 0
  });

  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(9).fill(0));
  const [barVelocities, setBarVelocities] = useState<number[]>(new Array(9).fill(0));
  const [barTargets, setBarTargets] = useState<number[]>(new Array(9).fill(0));

  // Initialize audio element and audio context for analysis
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioFile);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7;
      audioRef.current.loop = true; // Loop dance music
      
      // Set up audio event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
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
        console.error('Nightclub music error:', e);
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
      });

      audioRef.current.addEventListener('play', () => {
        setAudioState(prev => ({ ...prev, isPlaying: true }));
        isPlayingRef.current = true;
        startAudioAnalysis();
      });

      audioRef.current.addEventListener('pause', () => {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
        stopAudioAnalysis();
      });

      // Update current time for progress tracking
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setAudioState(prev => ({
            ...prev,
            currentTime: audioRef.current.currentTime
          }));
        }
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopAudioAnalysis();
    };
  }, [audioFile]);

  // Audio analysis setup
  const startAudioAnalysis = useCallback(() => {
    if (!audioRef.current || !audioRef.current.src) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // 128 frequency bins for better resolution
      analyserRef.current.smoothingTimeConstant = 0.6; // More responsive
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      // Start animation loop
      animateAudioLevels();
    } catch (error) {
      console.error('Failed to start audio analysis:', error);
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    sourceRef.current = null;
    
    // Reset levels and physics
    setAudioLevels(new Array(9).fill(0));
    setBarVelocities(new Array(9).fill(0));
    setBarTargets(new Array(9).fill(0));
  }, []);

  const animateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isPlayingRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Convert frequency data to 9 visualizer bars with better frequency mapping
    const newTargets: number[] = [];
    const barCount = 9;
    
    // Frequency ranges for each bar (Hz) - more realistic distribution
    const frequencyRanges = [
      [20, 60],      // Sub-bass
      [60, 250],     // Bass
      [250, 500],    // Low-mid
      [500, 2000],   // Mid
      [2000, 4000],  // Upper-mid
      [4000, 6000],  // Presence
      [6000, 8000],  // Brilliance
      [8000, 12000], // High
      [12000, 20000] // Ultra-high
    ];

    for (let i = 0; i < barCount; i++) {
      const [lowFreq, highFreq] = frequencyRanges[i];
      
      // Map frequency range to data array indices
      const lowIndex = Math.floor((lowFreq / 22050) * dataArray.length);
      const highIndex = Math.floor((highFreq / 22050) * dataArray.length);
      
      let maxLevel = 0;
      let sum = 0;
      let count = 0;
      
      // Get the maximum level in this frequency range
      for (let j = lowIndex; j <= highIndex && j < dataArray.length; j++) {
        if (dataArray[j] > maxLevel) {
          maxLevel = dataArray[j];
        }
        sum += dataArray[j];
        count++;
      }
      
      // Use both max and average for more dynamic response
      const average = count > 0 ? sum / count : 0;
      const combinedLevel = (maxLevel * 0.7 + average * 0.3) / 255;
      
      // Apply frequency-specific weighting for more realistic response
      let weightedLevel = combinedLevel;
      if (i < 3) { // Bass frequencies - more prominent and punchy
        weightedLevel *= 1.4;
        // Add bass punch effect
        if (weightedLevel > 0.3) {
          weightedLevel += Math.sin(Date.now() * 0.01) * 0.1;
        }
      } else if (i > 6) { // High frequencies - more airy and responsive
        weightedLevel *= 0.9;
        // Add high frequency shimmer
        if (weightedLevel > 0.2) {
          weightedLevel += Math.sin(Date.now() * 0.02 + i) * 0.05;
        }
      }
      
      // Add subtle randomness for natural movement
      const randomFactor = Math.random() * 0.08;
      const finalLevel = Math.min(1, Math.max(0, weightedLevel + randomFactor));
      
      newTargets.push(finalLevel);
    }

    // Update targets for smooth animation
    setBarTargets(newTargets);
    
    // Apply spring physics for realistic bar movement
    const newLevels: number[] = [];
    const newVelocities: number[] = [];
    
    for (let i = 0; i < barCount; i++) {
      const currentLevel = audioLevels[i];
      const targetLevel = newTargets[i];
      const currentVelocity = barVelocities[i];
      
      // Spring physics constants (different for each frequency range)
      let springStrength = 0.15; // Base spring strength
      let damping = 0.85;        // Base damping
      
      if (i < 3) { // Bass - slower, more powerful
        springStrength = 0.12;
        damping = 0.9;
      } else if (i > 6) { // Highs - faster, more responsive
        springStrength = 0.2;
        damping = 0.8;
      }
      
      // Calculate spring force
      const displacement = targetLevel - currentLevel;
      const springForce = displacement * springStrength;
      
      // Update velocity with spring force and damping
      const newVelocity = (currentVelocity + springForce) * damping;
      
      // Update position
      const newLevel = currentLevel + newVelocity;
      
      newLevels.push(Math.max(0, Math.min(1, newLevel)));
      newVelocities.push(newVelocity);
    }
    
    setAudioLevels(newLevels);
    setBarVelocities(newVelocities);
    
    animationFrameRef.current = requestAnimationFrame(animateAudioLevels);
  }, [audioLevels, barVelocities]);

  const getAudioLevels = useCallback(() => {
    return audioLevels;
  }, [audioLevels]);

  const playDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.volume = audioState.volume;
    
    audioRef.current.play().then(() => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to play dance music:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });
  }, [audioState.volume]);

  const stopDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    isPlayingRef.current = false;
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  const pauseDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    isPlayingRef.current = false;
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  const resumeDanceMusic = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.play().then(() => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      isPlayingRef.current = true;
    }).catch((error) => {
      console.error('Failed to resume dance music:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
    });
  }, []);

  const toggleMusic = useCallback(() => {
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
  }, [audioState.volume]);

  const isPlaying = useCallback(() => {
    return isPlayingRef.current;
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
    getAudioLevels,
    audioState
  };
};
