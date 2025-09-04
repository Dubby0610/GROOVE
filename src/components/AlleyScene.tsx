import React, { useEffect, useState } from 'react';
import ThreeAlleyScene from './ThreeAlleyScene';
import { LoadingScreen } from './LoadingScreen';

interface AlleySceneProps {
  onEnterBuilding: () => void;
}

export const AlleyScene: React.FC<AlleySceneProps> = ({ onEnterBuilding }) => {
  const [flickerState, setFlickerState] = useState(true);
  const [steamOpacity, setSteamOpacity] = useState(0.6);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef1 = React.useRef<HTMLAudioElement | null>(null);
  const audioRef2 = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Neon sign flickering animation
    const flickerInterval = setInterval(() => {
      setFlickerState(prev => !prev);
    }, Math.random() * 2000 + 1000);

    // Steam animation
    const steamInterval = setInterval(() => {
      setSteamOpacity(Math.random() * 0.4 + 0.3);
    }, 1500);

    return () => {
      clearInterval(flickerInterval);
      clearInterval(steamInterval);
      // Stop background music
      if (audioRef1.current) {
        audioRef1.current.pause();
        audioRef1.current.currentTime = 0;
      }
      if (audioRef2.current) {
        audioRef2.current.pause();
        audioRef2.current.currentTime = 0;
      }
    };
  }, []);

  // Play music only after loading is complete
  useEffect(() => {
    if (!isLoading) {
      // Stop any preserved background music from previous scenes
      const stopPreservedBackgroundMusic = () => {
        console.log('🛑 Stopping preserved background music for alley...');
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
          if ((audio as any).preservedDuringTransition) {
            console.log('🛑 Stopping preserved background music:', audio.src);
            audio.pause();
            audio.currentTime = 0;
            (audio as any).preservedDuringTransition = false;
          }
        });
      };
      
      // Stop preserved background music before starting alley music
      stopPreservedBackgroundMusic();
      
      // Play first background track (bbc_new-york.mp3) - traffic sounds, lower volume
      if (audioRef1.current) {
        audioRef1.current.currentTime = 0;
        audioRef1.current.volume = 0.1; // Lower volume for traffic sounds
        audioRef1.current.play().catch(() => {});
      }
      
      // Play second background track (Walking_groove_in_alley.mp3) - main groove, higher volume
      if (audioRef2.current) {
        audioRef2.current.currentTime = 0;
        audioRef2.current.volume = 0.4; // Increased volume for the walking groove
        audioRef2.current.play().catch(() => {});
      }
    }
  }, [isLoading]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-purple-900/30 to-black">
      {/* Background music for alley - Multiple tracks */}
      <audio
        ref={audioRef1}
        src="/sounds/bbc_new-york.mp3"
        loop
        style={{ display: 'none' }}
      />
      <audio
        ref={audioRef2}
        src="/sounds/Walking_groove_in_alley.mp3"
        loop
        style={{ display: 'none' }}
      />
      {isLoading && <LoadingScreen message="Loading alley..." />}
      {/* Three.js scene */}
      <ThreeAlleyScene 
        onEnterBuilding={onEnterBuilding}
        onLoaded={() => setIsLoading(false)}
      />
      
      {/* Overlay elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated background atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-purple-900/20 to-black animate-pulse" 
             style={{ animationDuration: '4s' }} />
        
        {/* Wonderful animated neon signs with dynamic effects */}
        <div className={`absolute top-16 left-8 text-pink-400 text-5xl font-bold transition-all duration-500 hover:scale-110 hover:text-pink-300 animate-neon-breathe ${
          flickerState ? 'opacity-100 animate-neon-flicker' : 'opacity-70 animate-neon-sparkle'
        }`} style={{ 
          textShadow: '0 0 8px #ff0080, 0 0 16px #ff0080, 0 0 24px #ff0080',
          letterSpacing: '0.05em'
        }}>
          <div className="relative">
            DISCO
            <div className="absolute inset-0 text-pink-200 animate-ping opacity-30" style={{ animationDuration: '3s' }}>DISCO</div>
          </div>
        </div>
        
        <div className="absolute top-28 right-16 text-cyan-400 text-3xl font-bold transition-all duration-300 hover:scale-105 hover:text-cyan-300 animate-neon-wave" 
             style={{ 
               animationDelay: '0.5s', 
               letterSpacing: '0.1em',
               textShadow: '0 0 6px #00ffff, 0 0 12px #00ffff, 0 0 18px #00ffff'
             }}>
          <div className="relative">
            24/7
            <div className="absolute inset-0 text-cyan-200 animate-ping opacity-25" style={{ animationDuration: '2.5s' }}>24/7</div>
          </div>
        </div>
        
        {/* Dynamic neon elements with enhanced animations */}
        <div className="absolute top-48 left-16 text-red-400 text-2xl font-bold transition-all duration-400 hover:scale-110 hover:text-red-300 animate-neon-flicker"
             style={{ 
               animationDelay: '2s', 
               letterSpacing: '0.05em',
               textShadow: '0 0 5px #ff4040, 0 0 10px #ff4040, 0 0 15px #ff4040'
             }}>
          <div className="relative">
            LIVE
            <div className="absolute inset-0 text-red-200 animate-ping opacity-20" style={{ animationDuration: '4s' }}>LIVE</div>
          </div>
        </div>
        
        <div className="absolute bottom-80 right-8 text-yellow-400 text-xl font-bold transition-all duration-300 hover:scale-105 hover:text-yellow-300 animate-neon-breathe"
             style={{ 
               animationDelay: '1.5s', 
               letterSpacing: '0.03em',
               textShadow: '0 0 4px #ffff00, 0 0 8px #ffff00, 0 0 12px #ffff00'
             }}>
          <div className="relative">
            OPEN
            <div className="absolute inset-0 text-yellow-200 animate-ping opacity-30" style={{ animationDuration: '3.5s' }}>OPEN</div>
          </div>
        </div>
        
        {/* Enhanced steam particles with floating animation */}
        <div className="absolute bottom-20 left-1/4 w-2 h-8 bg-gradient-to-t from-white/20 to-transparent animate-bounce"
             style={{ opacity: steamOpacity, animationDuration: '3s' }} />
        <div className="absolute bottom-16 right-1/3 w-1 h-6 bg-gradient-to-t from-white/15 to-transparent animate-bounce" 
             style={{ opacity: steamOpacity * 0.7, animationDelay: '1s', animationDuration: '2.5s' }} />
        <div className="absolute bottom-24 left-1/3 w-1 h-4 bg-gradient-to-t from-white/10 to-transparent animate-bounce"
             style={{ opacity: steamOpacity * 0.5, animationDelay: '2s', animationDuration: '3.5s' }} />
        
        {/* Wonderful animated graffiti elements */}
        <div className="absolute left-8 bottom-40 text-red-400 font-bold text-3xl opacity-90 transform -rotate-12 hover:opacity-100 hover:scale-110 transition-all duration-500 animate-neon-sparkle"
             style={{ 
               textShadow: '0 0 6px #ff0000, 0 0 12px #ff0000, 0 0 18px #ff0000',
               letterSpacing: '0.03em'
             }}>
          <div className="relative tracking-widest">
            GROOVE
            <div className="absolute inset-0 text-red-200 animate-ping opacity-25" style={{ animationDuration: '4s' }}>GROOVE</div>
          </div>
        </div>
        <div className="absolute right-12 bottom-60 text-blue-400 font-bold text-2xl opacity-85 transform rotate-6 hover:opacity-100 hover:scale-110 transition-all duration-500 animate-neon-wave"
             style={{ 
               textShadow: '0 0 5px #0080ff, 0 0 10px #0080ff, 0 0 15px #0080ff',
               letterSpacing: '0.02em'
             }}>
          <div className="relative tracking-widest">
            FUNK
            <div className="absolute inset-0 text-blue-200 animate-ping opacity-20" style={{ animationDuration: '3.5s' }}>FUNK</div>
          </div>
        </div>
        
        {/* Flickering street light effect */}
        <div className="absolute top-16 right-1/3 w-4 h-4 bg-yellow-300/60 rounded-full blur-sm animate-pulse"
             style={{ animationDuration: '1.5s' }}>
          <div className="absolute inset-0 bg-yellow-200/40 rounded-full animate-ping" />
        </div>
      </div>
      
    </div>
  );
};