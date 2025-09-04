import React, { useState, useRef, useEffect } from "react";
import ThreeElevatorScene, {
  ThreeElevatorSceneHandle,
} from "./ThreeElevatorScene";
import { LoadingScreen } from "./LoadingScreen";
import { useElevatorAudio } from "../hooks/useElevatorAudio.ts";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";

interface ElevatorSceneProps {
  onReachClubFloor: (floor: number) => void;
}

const FLOOR_IMAGES = [
  "/imgs/1st.png",
  "/imgs/2nd.png",
  "/imgs/3rd.png",
  "/imgs/4th.png",
];

const FLOOR_LABELS = [
  "1st floor - Party Vibes",
  "2nd floor - Boogie Wonderland",
  "3rd floor - For The Sexy People",
  "4th floor - Late Night Agenda",
];

export const ElevatorScene: React.FC<ElevatorSceneProps> = ({
  onReachClubFloor,
}) => {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [isMoving, setIsMoving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isElevatorLoading, setIsElevatorLoading] = useState(true);
  const [selectedClubImage, setSelectedClubImage] = useState<string | null>(
    null
  );
  const [isElevatorAnimating, setIsElevatorAnimating] = useState(false);
  const threeRef = useRef<ThreeElevatorSceneHandle>(null);
  const { playElevatorSound, stopElevatorSound, setVolume, getVolume, getAudioState, handlePhaseTransition } = useElevatorAudio();
  
  // Background music for elevator scene
  const { 
    playBackgroundMusic, 
    stopBackgroundMusic, 
    pauseBackgroundMusic, 
    resumeBackgroundMusic,
    setVolume: setBgVolume, 
    getVolume: getBgVolume, 
    audioState: bgAudioState 
  } = useBackgroundMusic('/sounds/In elevator and _Welcome..._ page groove.mp3');
  
  // Real-time synchronization state
  const [, setSyncInfo] = useState({
    currentKeyframe: 0,
    currentPhase: 'idle' as 'closing' | 'closed' | 'opening' | 'idle',
    phaseProgress: 0,
    audioTime: 0
  });

  // Update synchronization info in real-time
  useEffect(() => {
    if (!isElevatorAnimating) return;

    const syncInterval = setInterval(() => {
      if (threeRef.current && isElevatorAnimating) {
        const keyframe = threeRef.current.getCurrentKeyframe();
        const phase = threeRef.current.getCurrentPhase();
        const phaseProgress = threeRef.current.getPhaseProgress();
        const audioInfo = getAudioState();

        // Perfect synchronization: Handle phase transitions
        handlePhaseTransition(keyframe);

        setSyncInfo({
          currentKeyframe: keyframe,
          currentPhase: phase,
          phaseProgress: phaseProgress,
          audioTime: audioInfo.audioTime
        });
      }
    }, 50); // Update 20 times per second for smooth progress

    return () => clearInterval(syncInterval);
  }, [isElevatorAnimating, getAudioState]);

  const goToFloor = (floor: number) => {
    if (isMoving || floor === currentFloor) return;
    setIsMoving(true);
    setTimeout(() => {
      setCurrentFloor(floor);
      setIsMoving(false);
    }, 800);
  };

  const handleClubClick = () => {
    if (isElevatorAnimating) return; // Prevent multiple clicks during animation
    
    setSelectedClubImage(
      FLOOR_IMAGES[(currentFloor - 1) % FLOOR_IMAGES.length]
    );
    setIsElevatorAnimating(true);
    
    // Get the actual animation duration from the 3D scene
    const animationDuration = threeRef.current?.getAnimationDuration() || 8;
    
    // Start the elevator sound effect with perfect synchronization
    playElevatorSound(animationDuration);
    
    // Start the 3D animation
    threeRef.current?.playElevatorSequence();
    
    // Set up the completion handler based on actual animation duration
    setTimeout(() => {
      // Complete the scene transition
      onReachClubFloor(currentFloor);
    }, animationDuration * 1000); // Convert to milliseconds
  };

  // Handle animation completion from 3D scene
  const handleElevatorSequenceEnd = () => {
    setIsElevatorAnimating(false);
    stopElevatorSound();
    onReachClubFloor(currentFloor);
  };

  // Start background music when component mounts
  useEffect(() => {
    // Stop any preserved background music from previous scenes
    const stopPreservedBackgroundMusic = () => {
      console.log('🛑 Stopping preserved background music for elevator...');
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
    
    // Stop preserved background music before starting elevator music
    stopPreservedBackgroundMusic();
    
    // Add a small delay to ensure audio is properly initialized
    const timer = setTimeout(() => {
      playBackgroundMusic();
    }, 100);
    
    // Cleanup: stop music when component unmounts
    return () => {
      clearTimeout(timer);
      stopBackgroundMusic();
      stopElevatorSound();
    };
  }, [playBackgroundMusic, stopBackgroundMusic, stopElevatorSound]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-black">
      {/* Loading screen */}
      {isElevatorLoading && <LoadingScreen message="Calling the elevator..." />}
      {/* Left: Elevator 3D + Floor Buttons */}
      <div className="relative w-full lg:w-2/5 h-96 lg:h-screen bg-black flex-1">
        <ThreeElevatorScene
          ref={threeRef}
          floor={currentFloor}
          onLoaded={() => setIsElevatorLoading(false)}
          onElevatorSequenceEnd={handleElevatorSequenceEnd}
        />
        {/* Overlay floor buttons at right-bottom */}
        <div className="absolute flex flex-col gap-2 z-10 right-4 bottom-4">
          {[1, 2, 3, 4].map((floor) => (
            <button
              key={floor}
              onClick={() => goToFloor(floor)}
              disabled={isMoving || isElevatorAnimating}
              className={`w-14 h-10 rounded-lg border text-base font-medium transition-all duration-300 shadow-lg ${
                floor === currentFloor
                  ? "bg-amber-500 border-amber-400 text-black"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
              } ${
                isMoving || isElevatorAnimating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
        

          


        {/* Enhanced Music Controller - Hidden but functional */}
        <div className="absolute top-4 right-4 z-30 hidden">
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-2 border border-purple-500/50 shadow-2xl">
            <div className="text-purple-300 text-xs font-semibold mb-1 text-center tracking-wider">🎵</div>
            
            {/* Background Music Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (bgAudioState.isPlaying) {
                  pauseBackgroundMusic();
                } else {
                  resumeBackgroundMusic();
                }
              }}
              className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 mb-1 shadow-lg hover:shadow-purple-500/50 mx-auto"
            >
              {bgAudioState.isPlaying ? '⏸️' : '▶️'}
            </button>
            
            {/* Background Music Volume Control */}
            <div className="text-purple-300 text-xs mb-1 text-center">BG Vol</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={getBgVolume()}
              onChange={(e) => {
                e.stopPropagation();
                setBgVolume(parseFloat(e.target.value));
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-12 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${getBgVolume() * 100}%, #374151 ${getBgVolume() * 100}%, #374151 100%)`
              }}
            />
            <div className="text-purple-300 text-xs text-center">
              {Math.round(getBgVolume() * 100)}%
            </div>
            
            {/* Elevator Sound Effects Volume Control */}
            <div className="text-purple-300 text-xs mb-1 text-center mt-2">SFX Vol</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={getVolume()}
              onChange={(e) => {
                e.stopPropagation();
                setVolume(parseFloat(e.target.value));
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-12 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${getVolume() * 100}%, #374151 ${getVolume() * 100}%, #374151 100%)`
              }}
            />
            <div className="text-purple-300 text-xs text-center">
              {Math.round(getVolume() * 100)}%
            </div>
            
            {/* Music Status */}
            <div className="text-center mt-1">
              {bgAudioState.isLoaded ? (
                <div className={`w-1.5 h-1.5 rounded-full mx-auto ${bgAudioState.isPlaying ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-purple-400'}`}></div>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full mx-auto bg-gray-400"></div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Right: Club image */}
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/20 to-black h-full px-2 py-4">
        <div
          className={`h-56 sm:h-72 md:h-96 lg:h-[70%] mt-6 rounded-xl overflow-hidden shadow-lg mb-8 border-4 border-amber-700/30 flex items-center justify-center relative group ${
            isElevatorAnimating ? 'animate-pulse' : ''
          }`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={
              selectedClubImage ||
              FLOOR_IMAGES[(currentFloor - 1) % FLOOR_IMAGES.length]
            }
            alt={FLOOR_LABELS[(currentFloor - 1) % FLOOR_IMAGES.length]}
            className="object-cover w-full h-full cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={handleClubClick}
          />
          <button
            onClick={handleClubClick}
            disabled={isElevatorAnimating}
            className={`absolute inset-0 flex items-center justify-center bg-black/60 text-white text-5xl font-bold transition-all duration-300
              ${
                hovered && !isElevatorAnimating
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            style={{ pointerEvents: hovered && !isElevatorAnimating ? "auto" : "none" }}
          >
            {isElevatorAnimating ? "Going..." : "Go!"}
          </button>
        </div>
        <div className="text-lg text-white mb-2 text-center">
          {isElevatorAnimating ? "Elevator in motion..." : "Click image to Go"}
        </div>
        <div className="text-xl lg:text-2xl text-amber-400 font-bold mb-4 text-center">
          {FLOOR_LABELS[(currentFloor - 1) % FLOOR_IMAGES.length]}
        </div>
      </div>
    </div>
  );
};
