import React, { useEffect, useState } from 'react';
import { InteractiveHotspot } from './InteractiveHotspot';
import ThreeAlleyScene from './ThreeAlleyScene';

interface AlleySceneProps {
  onEnterBuilding: () => void;
}

export const AlleyScene: React.FC<AlleySceneProps> = ({ onEnterBuilding }) => {
  const [flickerState, setFlickerState] = useState(true);
  const [steamOpacity, setSteamOpacity] = useState(0.6);

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
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-purple-900/30 to-black">
      {/* Three.js scene */}
      <ThreeAlleyScene />
      
      {/* Overlay elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated background atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-purple-900/20 to-black animate-pulse" 
             style={{ animationDuration: '4s' }} />
        
        {/* Animated neon signs */}
        <div className={`absolute top-20 left-10 text-pink-400 text-2xl font-bold transition-all duration-300 ${
          flickerState ? 'opacity-100 animate-pulse' : 'opacity-30'
        }`}>
          <div className="neon-sign transform hover:scale-110 transition-transform duration-300">
            DISCO
          </div>
          <div className="absolute inset-0 neon-sign blur-sm opacity-50">DISCO</div>
        </div>
        
        <div className="absolute top-32 right-16 text-cyan-400 text-lg animate-pulse" 
             style={{ animationDelay: '0.5s' }}>
          <div className="neon-sign transform hover:scale-105 transition-transform duration-300">
            24/7
          </div>
          <div className="absolute inset-0 neon-sign blur-sm opacity-40">24/7</div>
        </div>
        
        {/* Additional animated neon elements */}
        <div className="absolute top-60 left-20 text-red-400 text-sm animate-pulse"
             style={{ animationDelay: '2s', animationDuration: '3s' }}>
          <div className="neon-sign opacity-70">LIVE</div>
        </div>
        
        <div className="absolute bottom-80 right-8 text-yellow-400 text-xs animate-pulse"
             style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
          <div className="neon-sign opacity-60">OPEN</div>
        </div>
        
        {/* Enhanced steam particles with floating animation */}
        <div className="absolute bottom-20 left-1/4 w-2 h-8 bg-gradient-to-t from-white/20 to-transparent animate-bounce"
             style={{ opacity: steamOpacity, animationDuration: '3s' }} />
        <div className="absolute bottom-16 right-1/3 w-1 h-6 bg-gradient-to-t from-white/15 to-transparent animate-bounce" 
             style={{ opacity: steamOpacity * 0.7, animationDelay: '1s', animationDuration: '2.5s' }} />
        <div className="absolute bottom-24 left-1/3 w-1 h-4 bg-gradient-to-t from-white/10 to-transparent animate-bounce"
             style={{ opacity: steamOpacity * 0.5, animationDelay: '2s', animationDuration: '3.5s' }} />
        
        {/* Animated graffiti elements with glow effects */}
        <div className="absolute left-8 bottom-40 text-red-400 font-bold text-sm opacity-70 transform -rotate-12 hover:opacity-100 transition-opacity duration-300">
          <div className="animate-pulse" style={{ animationDuration: '3s' }}>GROOVE</div>
          <div className="absolute inset-0 blur-sm opacity-50 animate-pulse" style={{ animationDuration: '3s' }}>GROOVE</div>
        </div>
        <div className="absolute right-12 bottom-60 text-blue-400 font-bold text-xs opacity-60 transform rotate-6 hover:opacity-100 transition-opacity duration-300">
          <div className="animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>FUNK</div>
          <div className="absolute inset-0 blur-sm opacity-40 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>FUNK</div>
        </div>
        
        {/* Flickering street light effect */}
        <div className="absolute top-16 right-1/3 w-4 h-4 bg-yellow-300/60 rounded-full blur-sm animate-pulse"
             style={{ animationDuration: '1.5s' }}>
          <div className="absolute inset-0 bg-yellow-200/40 rounded-full animate-ping" />
        </div>
      </div>
      
      {/* Interactive hotspot for building entrance */}
      <InteractiveHotspot
        x={35}
        y={60}
        width={30}
        height={40}
        onClick={onEnterBuilding}
        hoverText="Enter the building"
        className="z-10"
      />
    </div>
  );
};