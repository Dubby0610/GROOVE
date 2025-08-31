import { useState, useEffect, useRef } from 'react';
import { AudioState } from '../types';

export const useAudio = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    isLoaded: false,
    isPlaying: false,
    volume: 0.7
  });

  const discoTrackRef = useRef<HTMLAudioElement | null>(null);
  const ambientSoundsRef = useRef<HTMLAudioElement | null>(null);
  const elevatorSoundRef = useRef<HTMLAudioElement | null>(null);
  const djVoiceOverRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    discoTrackRef.current = new Audio();
    ambientSoundsRef.current = new Audio();
    elevatorSoundRef.current = new Audio();
    djVoiceOverRef.current = new Audio();

    // Load the actual elevator sound effect
    if (elevatorSoundRef.current) {
      elevatorSoundRef.current.src = '/sounds/elevator_ride.mp3';
      elevatorSoundRef.current.preload = 'auto';
      elevatorSoundRef.current.volume = 0.6;
    }

    // Load the DJ voice-over audio
    if (djVoiceOverRef.current) {
      djVoiceOverRef.current.src = '/sounds/voiceover.mp3';
      djVoiceOverRef.current.preload = 'auto';
      djVoiceOverRef.current.volume = 0.8;
    }

    // For demo purposes, we'll use data URLs for simple tones
    // In production, you'd load actual audio files
    setAudioState(prev => ({ ...prev, isLoaded: true }));

    return () => {
      [discoTrackRef, ambientSoundsRef, elevatorSoundRef, djVoiceOverRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
          ref.current = null;
        }
      });
    };
  }, []);

  const playDiscoTrack = (muffled = false) => {
    if (discoTrackRef.current) {
      discoTrackRef.current.volume = muffled ? 0.3 : 0.7;
      discoTrackRef.current.loop = true;
      discoTrackRef.current.play().catch(console.log);
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const playAmbientSounds = () => {
    if (ambientSoundsRef.current) {
      ambientSoundsRef.current.volume = 0.4;
      ambientSoundsRef.current.loop = true;
      ambientSoundsRef.current.play().catch(console.log);
    }
  };

  const playElevatorSound = () => {
    if (elevatorSoundRef.current) {
      elevatorSoundRef.current.volume = 0.6;
      elevatorSoundRef.current.currentTime = 0;
      elevatorSoundRef.current.play().catch(console.log);
    }
  };

  const stopElevatorSound = () => {
    if (elevatorSoundRef.current) {
      elevatorSoundRef.current.pause();
      elevatorSoundRef.current.currentTime = 0;
    }
  };

  const stopAllSounds = () => {
    [discoTrackRef, ambientSoundsRef, elevatorSoundRef, djVoiceOverRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  };

  const playDJVoiceOver = () => {
    if (djVoiceOverRef.current) {
      djVoiceOverRef.current.currentTime = 0;
      djVoiceOverRef.current.play().catch(console.log);
    }
  };

  return {
    audioState,
    playDiscoTrack,
    playAmbientSounds,
    playElevatorSound,
    stopElevatorSound,
    stopAllSounds,
    playDJVoiceOver
  };
};