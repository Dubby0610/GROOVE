import React, { useState, useEffect } from 'react';
import { Scene, GameState } from './types';
import { useAudio } from './hooks/useAudio';
import { LoadingScreen } from './components/LoadingScreen';
import { NavigationIndicator } from './components/NavigationIndicator';
import { AlleyScene } from './components/AlleyScene';
import { ElevatorScene } from './components/ElevatorScene';
import { ClubDoorScene } from './components/ClubDoorScene';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentScene: 'alley',
    isLoading: false,
    hasEnteredClub: false,
    guestCount: 247
  });

  const [showEntryPrompt, setShowEntryPrompt] = useState(true);
  const { playDiscoTrack, playAmbientSounds, playElevatorSound, playDJVoiceOver } = useAudio();

  const handleStartExperience = () => {
    setShowEntryPrompt(false);
    playAmbientSounds();
  };

  const changeScene = (newScene: Scene, loadingMessage?: string) => {
    setGameState(prev => ({ ...prev, isLoading: true }));
    
    setTimeout(() => {
      setGameState(prev => ({ 
        ...prev, 
        currentScene: newScene, 
        isLoading: false 
      }));
      
      // Play appropriate audio for each scene
      if (newScene === 'elevator') {
        playElevatorSound();
      } else if (newScene === 'club-door') {
        playDiscoTrack(true); // Muffled version
      }
    }, 1500);
  };

  const handleEnterBuilding = () => {
    changeScene('elevator', 'Calling the elevator...');
  };

  const handleReachClubFloor = () => {
    changeScene('club-door', 'Arriving at the club...');
  };

  const handleEnterClub = () => {
    setGameState(prev => ({ ...prev, hasEnteredClub: true, isLoading: true }));
    playDiscoTrack(false); // Clear version
    
    setTimeout(() => {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }, 2000);
  };

  if (showEntryPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="mb-12">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 mb-4 animate-pulse">
              GROOVE
            </h1>
            <p className="text-cyan-400 text-xl tracking-widest">NIGHTCLUB</p>
            <p className="text-gray-400 text-sm mt-2">An immersive experience</p>
          </div>
          
          <button
            onClick={handleStartExperience}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Enter Guest Mode
          </button>
          
          <div className="mt-8 text-gray-400 text-sm">
            <p>🎧 Audio experience included</p>
            <p>👆 Click to explore</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.hasEnteredClub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 animate-pulse">
              Welcome to GROOVE!
            </h1>
            <p className="text-purple-200 text-lg">
              You've successfully entered the club! 🎉
            </p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-purple-400/50">
            <p className="text-white text-sm leading-relaxed">
              This prototype demonstrates the complete nightclub entrance experience with:
              <br />✨ Interactive navigation system
              <br />🎵 Audio integration
              <br />💫 Dynamic lighting effects
              <br />🎨 Immersive atmosphere
            </p>
          </div>
          
          <button
            onClick={() => {
              setGameState({
                currentScene: 'alley',
                isLoading: false,
                hasEnteredClub: false,
                guestCount: gameState.guestCount + 1
              });
            }}
            className="mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300"
          >
            Experience Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {gameState.isLoading && <LoadingScreen />}
      
      <NavigationIndicator currentScene={gameState.currentScene} />
      
      {gameState.currentScene === 'alley' && (
        <AlleyScene onEnterBuilding={handleEnterBuilding} />
      )}
      
      {gameState.currentScene === 'elevator' && (
        <ElevatorScene onReachClubFloor={handleReachClubFloor} />
      )}
      
      {gameState.currentScene === 'club-door' && (
        <ClubDoorScene 
          onEnterClub={handleEnterClub}
          playDJVoiceOver={playDJVoiceOver}
        />
      )}
    </div>
  );
}

export default App;