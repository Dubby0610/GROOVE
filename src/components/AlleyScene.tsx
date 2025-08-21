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
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Play music only after loading is complete
  useEffect(() => {
    if (!isLoading && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    }
  }, [isLoading]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-purple-900/30 to-black">
      {/* Background music for alley */}
      <audio
        ref={audioRef}
        src="/sounds/bbc_new-york.mp3"
        loop
        autoPlay
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
        
        {/* Animated neon signs */}
        <div className={`absolute top-16 left-10 text-pink-400 text-5xl font-extrabold transition-all duration-300 drop-shadow-[0_0_20px_rgba(255,0,128,0.7)] ${
          flickerState ? 'opacity-100 animate-pulse' : 'opacity-30'
        }`}>
          <div className="neon-sign transform hover:scale-110 transition-transform duration-300 tracking-widest">
            DISCO
          </div>
          <div className="absolute inset-0 neon-sign blur-lg opacity-60">DISCO</div>
        </div>
        
        <div className="absolute top-32 right-16 text-cyan-400 text-3xl font-bold animate-pulse drop-shadow-[0_0_16px_rgba(0,255,255,0.6)]" 
             style={{ animationDelay: '0.5s', letterSpacing: '0.2em' }}>
          <div className="neon-sign transform hover:scale-105 transition-transform duration-300">
            24/7
          </div>
          <div className="absolute inset-0 neon-sign blur-lg opacity-40">24/7</div>
        </div>
        
        {/* Additional animated neon elements */}
        <div className="absolute top-60 left-20 text-red-400 text-2xl font-bold animate-pulse drop-shadow-[0_0_12px_rgba(255,64,64,0.5)]"
             style={{ animationDelay: '2s', animationDuration: '3s', letterSpacing: '0.15em' }}>
          <div className="neon-sign opacity-80">LIVE</div>
          <div className="absolute inset-0 neon-sign blur-md opacity-50">LIVE</div>
        </div>
        
        <div className="absolute bottom-80 right-8 text-yellow-400 text-xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(255,255,0,0.4)]"
             style={{ animationDelay: '1.5s', animationDuration: '2.5s', letterSpacing: '0.12em' }}>
          <div className="neon-sign opacity-70">OPEN</div>
          <div className="absolute inset-0 neon-sign blur-md opacity-40">OPEN</div>
        </div>
        
        {/* Enhanced steam particles with floating animation */}
        <div className="absolute bottom-20 left-1/4 w-2 h-8 bg-gradient-to-t from-white/20 to-transparent animate-bounce"
             style={{ opacity: steamOpacity, animationDuration: '3s' }} />
        <div className="absolute bottom-16 right-1/3 w-1 h-6 bg-gradient-to-t from-white/15 to-transparent animate-bounce" 
             style={{ opacity: steamOpacity * 0.7, animationDelay: '1s', animationDuration: '2.5s' }} />
        <div className="absolute bottom-24 left-1/3 w-1 h-4 bg-gradient-to-t from-white/10 to-transparent animate-bounce"
             style={{ opacity: steamOpacity * 0.5, animationDelay: '2s', animationDuration: '3.5s' }} />
        
        {/* Animated graffiti elements with glow effects */}
        <div className="absolute left-8 bottom-40 text-red-400 font-extrabold text-3xl opacity-80 transform -rotate-12 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_18px_rgba(255,0,0,0.5)]">
          <div className="animate-pulse tracking-widest" style={{ animationDuration: '3s' }}>GROOVE</div>
          <div className="absolute inset-0 blur-lg opacity-50 animate-pulse" style={{ animationDuration: '3s' }}>GROOVE</div>
        </div>
        <div className="absolute right-12 bottom-60 text-blue-400 font-extrabold text-2xl opacity-70 transform rotate-6 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_14px_rgba(0,128,255,0.5)]">
          <div className="animate-pulse tracking-widest" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>FUNK</div>
          <div className="absolute inset-0 blur-lg opacity-40 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>FUNK</div>
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