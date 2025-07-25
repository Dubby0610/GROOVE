import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAudio } from './hooks/useAudio';
import { LoadingScreen } from './components/LoadingScreen';
import { NavigationIndicator } from './components/NavigationIndicator';
import { AlleyScene } from './components/AlleyScene';
import { ElevatorScene } from './components/ElevatorScene';
import { ClubDoorScene } from './components/ClubDoorScene';
import  NightClubScene  from './components/NightClubScene';

function MainPage() {
  const navigate = useNavigate();
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
          onClick={() => navigate('/alley')}
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

function ClubSuccessPage() {
  const navigate = useNavigate();
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
          onClick={() => navigate('/')}
          className="mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300"
        >
          Experience Again
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { playDiscoTrack, playAmbientSounds, playElevatorSound, playDJVoiceOver } = useAudio();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [selectedClubFloor, setSelectedClubFloor] = useState<number | null>(null);
  // Add a state to track if club floor is being determined
  const [isDeterminingFloor, setIsDeterminingFloor] = useState(false);

  const navigate = useNavigate();

  // Restore selected floor from localStorage on mount
  useEffect(() => {
    const storedFloor = localStorage.getItem("selectedClubFloor");
    if (storedFloor) setSelectedClubFloor(Number(storedFloor));
  }, []);

  // Alley → Elevator
  const handleEnterBuilding = () => {
    setIsLoading(true);
    setLoadingMessage('Calling the elevator...');
    playElevatorSound();
    setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage(undefined);
      navigate('/elevator');
    }, 1500);
  };

  // When user selects a floor in the elevator:
  const handleReachClubFloor = (floor: number) => {
    setSelectedClubFloor(floor);
    localStorage.setItem("selectedClubFloor", String(floor));
    setIsLoading(true);
    setLoadingMessage("Arriving at the club...");
    setTimeout(() => {
      setIsLoading(false);
      navigate('/club-door');
    }, 1000); // Show loading for 1s
  };

  // Club Door → Club Success
  const handleEnterClub = () => {
    setIsLoading(true);
    setLoadingMessage('Entering the club...');
    setIsDeterminingFloor(true);
    playDiscoTrack(false); // Clear
    setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage(undefined);
      navigate('/club-success');
      setTimeout(() => setIsDeterminingFloor(false), 1000); // Show loading for 1s after navigation
    }, 2000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <NavigationIndicator
        currentScene={
          window.location.pathname === '/alley'
            ? 'alley'
            : window.location.pathname === '/elevator'
            ? 'elevator'
            : window.location.pathname === '/club-door'
            ? 'club-door'
            : 'alley'
        }
      />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/alley" element={<AlleyScene onEnterBuilding={handleEnterBuilding} />} />
        <Route path="/elevator" element={<ElevatorScene onReachClubFloor={handleReachClubFloor} />} />
        <Route
          path="/club-door"
          element={
            <ClubDoorScene
              clubFloor={selectedClubFloor}
              onEnterClub={handleEnterClub}
              playDJVoiceOver={playDJVoiceOver}
            />
          }
        />
        <Route
          path="/club-success"
          element={
            (selectedClubFloor || localStorage.getItem("selectedClubFloor")) ? (
              isDeterminingFloor ? (
                <LoadingScreen message="Loading your club experience..." />
              ) : (
                <NightClubScene floor={selectedClubFloor || Number(localStorage.getItem("selectedClubFloor"))} />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-white text-2xl">No floor selected.</div>
            )
          }
        />
        <Route path="*" element={<MainPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;