import { useRef, useCallback, useState } from 'react';

interface UseElevatorAudioReturn {
  playElevatorSound: (animationDuration: number) => void;
  stopElevatorSound: () => void;
  isPlaying: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  handlePhaseTransition: (keyframe: number) => void;
  getAudioState: () => {
    currentPhase: 'closing' | 'closed' | 'opening' | 'idle';
    phaseProgress: number;
    audioTime: number;
    keyframeProgress: number;
    currentAudioFile: string;
  };
  audioState: {
    isLoaded: boolean;
    isPlaying: boolean;
    volume: number;
    duration: number;
  };
}

// Perfect synchronization constants for 3 separate audio files
const ANIMATION_PHASES = {
  DOOR_CLOSE: { 
    startFrame: 0, 
    endFrame: 70, 
    audioFile: 'elevator_close_door.mp3',
    audioDuration: 4
  },
  DOOR_CLOSED: { 
    startFrame: 71, 
    endFrame: 230, 
    audioFile: 'elevator_moving.mp3',
    audioDuration: 20
  },
  DOOR_OPEN: { 
    startFrame: 231, 
    endFrame: 300, 
    audioFile: 'elevator_open_door.mp3',
    audioDuration: 4
  }
};

const TOTAL_FRAMES = 300;

export const useElevatorAudio = (): UseElevatorAudioReturn => {
  // Separate audio elements for each phase
  const closeDoorAudioRef = useRef<HTMLAudioElement | null>(null);
  const movingAudioRef = useRef<HTMLAudioElement | null>(null);
  const openDoorAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const isPlayingRef = useRef(false);
  const currentPhaseRef = useRef<'closing' | 'closed' | 'opening' | 'idle'>('idle');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [audioState, setAudioState] = useState({
    isLoaded: false,
    isPlaying: false,
    volume: 0.6,
    duration: 28 // Total duration: 4 + 20 + 4 = 28 seconds
  });

  // Initialize all three audio elements
  if (!closeDoorAudioRef.current) {
    closeDoorAudioRef.current = new Audio('/sounds/elevator_close_door.mp3');
    closeDoorAudioRef.current.preload = 'auto';
    closeDoorAudioRef.current.volume = 0.6;
  }
  
  if (!movingAudioRef.current) {
    movingAudioRef.current = new Audio('/sounds/elevator_moving.mp3');
    movingAudioRef.current.preload = 'auto';
    movingAudioRef.current.volume = 0.6;
  }
  
  if (!openDoorAudioRef.current) {
    openDoorAudioRef.current = new Audio('/sounds/elevator_open_door.mp3');
    openDoorAudioRef.current.preload = 'auto';
    openDoorAudioRef.current.volume = 0.6;
  }

  // Set up audio event listeners for all files
  const setupAudioListeners = (audioElement: HTMLAudioElement) => {
    audioElement.addEventListener('loadedmetadata', () => {
      setAudioState(prev => ({ ...prev, isLoaded: true }));
    });

    audioElement.addEventListener('ended', () => {
      // Only stop if we're not transitioning to next phase
      if (currentPhaseRef.current === 'idle') {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
      }
    });

    audioElement.addEventListener('error', (e) => {
      console.error('Elevator audio error:', e);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
      currentPhaseRef.current = 'idle';
    });
  };

  // Setup listeners for all audio files
  if (closeDoorAudioRef.current && !closeDoorAudioRef.current.hasAttribute('data-listeners-setup')) {
    setupAudioListeners(closeDoorAudioRef.current);
    closeDoorAudioRef.current.setAttribute('data-listeners-setup', 'true');
  }
  
  if (movingAudioRef.current && !movingAudioRef.current.hasAttribute('data-listeners-setup')) {
    setupAudioListeners(movingAudioRef.current);
    movingAudioRef.current.setAttribute('data-listeners-setup', 'true');
  }
  
  if (openDoorAudioRef.current && !openDoorAudioRef.current.hasAttribute('data-listeners-setup')) {
    setupAudioListeners(openDoorAudioRef.current);
    openDoorAudioRef.current.setAttribute('data-listeners-setup', 'true');
  }

  // Stop all audio files
  const stopAllAudio = () => {
    [closeDoorAudioRef, movingAudioRef, openDoorAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    currentAudioRef.current = null;
  };

  // Play audio for specific phase
  const playPhaseAudio = (phase: 'closing' | 'closed' | 'opening') => {
    // Stop any currently playing audio
    stopAllAudio();
    
    let targetAudio: HTMLAudioElement | null = null;
    
    switch (phase) {
      case 'closing':
        targetAudio = closeDoorAudioRef.current;
        break;
      case 'closed':
        targetAudio = movingAudioRef.current;
        break;
      case 'opening':
        targetAudio = openDoorAudioRef.current;
        break;
    }
    
    if (targetAudio) {
      targetAudio.currentTime = 0;
      targetAudio.volume = audioState.volume;
      targetAudio.play().catch(console.error);
      currentAudioRef.current = targetAudio;
      currentPhaseRef.current = phase;
    }
  };

  // Calculate current phase and progress based on keyframe
  const calculatePhaseFromKeyframe = (keyframe: number) => {
    if (keyframe <= ANIMATION_PHASES.DOOR_CLOSE.endFrame) {
      return {
        phase: 'closing' as const,
        phaseProgress: (keyframe - ANIMATION_PHASES.DOOR_CLOSE.startFrame) / 
                     (ANIMATION_PHASES.DOOR_CLOSE.endFrame - ANIMATION_PHASES.DOOR_CLOSE.startFrame),
        audioFile: ANIMATION_PHASES.DOOR_CLOSE.audioFile,
        audioDuration: ANIMATION_PHASES.DOOR_CLOSE.audioDuration
      };
    } else if (keyframe <= ANIMATION_PHASES.DOOR_CLOSED.endFrame) {
      return {
        phase: 'closed' as const,
        phaseProgress: (keyframe - ANIMATION_PHASES.DOOR_CLOSED.startFrame) / 
                     (ANIMATION_PHASES.DOOR_CLOSED.endFrame - ANIMATION_PHASES.DOOR_CLOSED.startFrame),
        audioFile: ANIMATION_PHASES.DOOR_CLOSED.audioFile,
        audioDuration: ANIMATION_PHASES.DOOR_CLOSED.audioDuration
      };
    } else {
      return {
        phase: 'opening' as const,
        phaseProgress: (keyframe - ANIMATION_PHASES.DOOR_OPEN.startFrame) / 
                     (ANIMATION_PHASES.DOOR_OPEN.endFrame - ANIMATION_PHASES.DOOR_OPEN.startFrame),
        audioFile: ANIMATION_PHASES.DOOR_OPEN.audioFile,
        audioDuration: ANIMATION_PHASES.DOOR_OPEN.audioDuration
      };
    }
  };

  const playElevatorSound = useCallback((animationDuration: number) => {
    // Start with closing phase
    currentPhaseRef.current = 'closing';
    playPhaseAudio('closing');
    
    setAudioState(prev => ({ ...prev, isPlaying: true }));
    isPlayingRef.current = true;
  }, [audioState.volume]);

  const stopElevatorSound = useCallback(() => {
    stopAllAudio();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    isPlayingRef.current = false;
    currentPhaseRef.current = 'idle';
  }, []);

  // Perfect synchronization: Handle phase transitions based on keyframe
  const handlePhaseTransition = useCallback((keyframe: number) => {
    const phaseInfo = calculatePhaseFromKeyframe(keyframe);
    
    // Check if we need to transition to a new phase
    if (phaseInfo.phase !== currentPhaseRef.current) {
      console.log(`Phase transition: ${currentPhaseRef.current} → ${phaseInfo.phase} at frame ${keyframe}`);
      
      // Stop current audio and start new phase
      playPhaseAudio(phaseInfo.phase);
    }
    
    // For moving phase (71-230), we need to handle early stopping
    if (phaseInfo.phase === 'closed' && keyframe >= ANIMATION_PHASES.DOOR_CLOSED.endFrame) {
      // Stop moving audio when we reach the end of the closed phase
      if (movingAudioRef.current && currentAudioRef.current === movingAudioRef.current) {
        movingAudioRef.current.pause();
        movingAudioRef.current.currentTime = 0;
      }
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    
    // Update volume for all audio elements
    [closeDoorAudioRef, movingAudioRef, openDoorAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.volume = clampedVolume;
      }
    });
  }, []);

  const getVolume = useCallback(() => {
    return audioState.volume;
  }, [audioState.volume]);

  const isPlaying = useCallback(() => {
    return isPlayingRef.current;
  }, []);

  // Get current audio state with phase information
  const getAudioState = useCallback(() => {
    const currentTime = currentAudioRef.current?.currentTime || 0;
    const keyframeProgress = (currentTime / (currentAudioRef.current?.duration || 1)) * TOTAL_FRAMES;
    
    const phaseInfo = calculatePhaseFromKeyframe(keyframeProgress);
    
    return {
      currentPhase: phaseInfo.phase,
      phaseProgress: phaseInfo.phaseProgress,
      audioTime: currentTime,
      keyframeProgress: keyframeProgress,
      currentAudioFile: phaseInfo.audioFile
    };
  }, []);

  return {
    playElevatorSound,
    stopElevatorSound,
    isPlaying,
    setVolume,
    getVolume,
    handlePhaseTransition,
    getAudioState,
    audioState
  };
};
