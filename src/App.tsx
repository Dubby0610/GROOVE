import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAudio } from './hooks/useAudio';
import { LoadingScreen } from './components/LoadingScreen';
import { AlleyScene } from './components/AlleyScene';
import { ElevatorScene } from './components/ElevatorScene';
import { ClubDoorScene } from './components/ClubDoorScene';
import  NightClubScene  from './components/NightClubScene';
import { ImageBasedLanding } from './components/ImageBasedLanding';

function MainPage() {
  const navigate = useNavigate();
  return (
    <ImageBasedLanding onEnterGuestMode={() => navigate('/alley')} />
  );
}

function AppRoutes() {
  const { playDiscoTrack, playElevatorSound, playDJVoiceOver } = useAudio();
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