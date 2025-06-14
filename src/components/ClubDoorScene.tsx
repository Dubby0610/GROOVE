import React, { useState, useEffect } from 'react';
import { InteractiveHotspot } from './InteractiveHotspot';

interface ClubDoorSceneProps {
  onEnterClub: () => void;
  playDJVoiceOver: () => void;
}

export const ClubDoorScene: React.FC<ClubDoorSceneProps> = ({ onEnterClub, playDJVoiceOver }) => {
  const [pulseIntensity, setPulseIntensity] = useState(0.5);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    // Simulate music-driven lighting pulse
    const interval = setInterval(() => {
      setPulseIntensity(Math.random() * 0.5 + 0.3);
    }, 200);

    // Trigger DJ voice-over after a moment
    const voiceOverTimer = setTimeout(() => {
      playDJVoiceOver();
      setShowWelcomeMessage(true);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(voiceOverTimer);
    };
  }, [playDJVoiceOver]);

  const handleEnterClub = () => {
    setShowWelcomeMessage(false);
    onEnterClub();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Hallway atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black" />
      
      {/* Club door */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-80 bg-gradient-to-t from-gray-900 to-gray-800 border-2 border-gray-700">
        {/* Door panels */}
        <div className="absolute inset-4 border border-gray-600 bg-gradient-to-t from-gray-800 to-gray-700" />
        <div className="absolute top-8 left-8 right-8 h-1/3 border-b border-gray-600" />
        
        {/* Door handle */}
        <div className="absolute right-6 top-1/2 w-3 h-6 bg-brass rounded-sm" />
        
        {/* Light seeping under door */}
        <div 
          className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-t from-purple-500 to-transparent"
          style={{ opacity: pulseIntensity }}
        />
        <div 
          className="absolute -bottom-1 left-2 right-2 h-2 bg-gradient-to-t from-pink-500 to-transparent animate-pulse"
          style={{ opacity: pulseIntensity * 0.8 }}
        />
      </div>
      
      {/* Club signage */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 animate-pulse mb-4">
          GROOVE
        </div>
        <div className="text-2xl font-light text-cyan-400 tracking-widest">
          NIGHTCLUB
        </div>
        <div className="mt-4 text-sm text-gray-400">
          EST. 1975
        </div>
      </div>
      
      {/* Pulsing club lighting effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: pulseIntensity }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Sound visualization bars */}
      <div className="absolute bottom-20 left-8 flex space-x-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-purple-500 to-pink-500 animate-pulse"
            style={{
              height: `${Math.random() * 40 + 10}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.3 + Math.random() * 0.3}s`
            }}
          />
        ))}
      </div>
      
      <div className="absolute bottom-20 right-8 flex space-x-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-cyan-500 to-blue-500 animate-pulse"
            style={{
              height: `${Math.random() * 30 + 15}px`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.4 + Math.random() * 0.4}s`
            }}
          />
        ))}
      </div>
      
      {/* DJ Voice-over message */}
      {showWelcomeMessage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 max-w-md mx-4">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50 animate-fade-in">
            <div className="text-center">
              <div className="text-2xl mb-2">🎤</div>
              <div className="text-purple-400 font-medium mb-2">DJ Voice-Over</div>
              <div className="text-white text-sm leading-relaxed">
                "Welcome to the hottest spot in the city! Get ready to experience the grooviest night of your life..."
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Interactive hotspot for club door */}
      <InteractiveHotspot
        x={35}
        y={20}
        width={30}
        height={80}
        onClick={handleEnterClub}
        hoverText="Enter the club"
        className="z-10"
      />
      
      {/* Guest count display */}
      <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-sm rounded-lg p-3">
        <div className="text-cyan-400 text-sm font-medium">Guests Tonight</div>
        <div className="text-white text-2xl font-bold">247</div>
      </div>
    </div>
  );
};