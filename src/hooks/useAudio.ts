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

  useEffect(() => {
    // Initialize audio elements
    discoTrackRef.current = new Audio();
    ambientSoundsRef.current = new Audio();
    elevatorSoundRef.current = new Audio();

    // For demo purposes, we'll use data URLs for simple tones
    // In production, you'd load actual audio files
    setAudioState(prev => ({ ...prev, isLoaded: true }));

    return () => {
      [discoTrackRef, ambientSoundsRef, elevatorSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
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
      elevatorSoundRef.current.volume = 0.5;
      elevatorSoundRef.current.play().catch(console.log);
    }
  };

  const stopAllSounds = () => {
    [discoTrackRef, ambientSoundsRef, elevatorSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  };

  const playDJVoiceOver = () => {
    // Simulate DJ voice-over with a simple notification
    console.log('🎤 DJ: "Welcome to the hottest spot in the city..."');
  };

  return {
    audioState,
    playDiscoTrack,
    playAmbientSounds,
    playElevatorSound,
    stopAllSounds,
    playDJVoiceOver
  };
};