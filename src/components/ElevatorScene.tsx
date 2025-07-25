import React, { useState, useRef } from "react";
import ThreeElevatorScene, {
  ThreeElevatorSceneHandle,
} from "./ThreeElevatorScene";
import { LoadingScreen } from "./LoadingScreen";

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

const ELEVATOR_ANIMATION_DURATION = 8000;

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
  const threeRef = useRef<ThreeElevatorSceneHandle>(null);

  const goToFloor = (floor: number) => {
    if (isMoving || floor === currentFloor) return;
    setIsMoving(true);
    setTimeout(() => {
      setCurrentFloor(floor);
      setIsMoving(false);
    }, 800);
  };

  const handleClubClick = () => {
    setSelectedClubImage(
      FLOOR_IMAGES[(currentFloor - 1) % FLOOR_IMAGES.length]
    );
    threeRef.current?.playElevatorSequence();
    setTimeout(() => {
      onReachClubFloor(currentFloor);
    }, ELEVATOR_ANIMATION_DURATION);
  };

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
        />
        {/* Overlay floor buttons at right-bottom */}
        <div className="absolute flex flex-col gap-2 z-10 right-4 bottom-4">
          {[1, 2, 3, 4].map((floor) => (
            <button
              key={floor}
              onClick={() => goToFloor(floor)}
              disabled={isMoving}
              className={`w-14 h-10 rounded-lg border text-base font-medium transition-all duration-300 shadow-lg ${
                floor === currentFloor
                  ? "bg-amber-500 border-amber-400 text-black"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
              } ${
                isMoving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>
      {/* Right: Club image */}
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/20 to-black h-full px-2 py-4">
        <div
          className="h-56 sm:h-72 md:h-96 lg:h-[70%] mt-6 rounded-xl overflow-hidden shadow-lg mb-8 border-4 border-amber-700/30 flex items-center justify-center relative group"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={
              selectedClubImage ||
              FLOOR_IMAGES[(currentFloor - 1) % FLOOR_IMAGES.length]
            }
            alt={FLOOR_LABELS[(currentFloor - 1) % FLOOR_LABELS.length]}
            className="object-cover w-full h-full cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={handleClubClick}
          />
          <button
            onClick={handleClubClick}
            className={`absolute inset-0 flex items-center justify-center bg-black/60 text-white text-5xl font-bold transition-all duration-300
              ${
                hovered
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            style={{ pointerEvents: hovered ? "auto" : "none" }}
          >
            Go!
          </button>
        </div>
        <div className="text-lg text-white mb-2 text-center">
          Click image to Go
        </div>
        <div className="text-xl lg:text-2xl text-amber-400 font-bold mb-4 text-center">
          {FLOOR_LABELS[(currentFloor - 1) % FLOOR_LABELS.length]}
        </div>
      </div>
    </div>
  );
};
