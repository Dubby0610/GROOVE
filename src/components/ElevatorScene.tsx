import React, { useState } from 'react';

interface ElevatorSceneProps {
  onReachClubFloor: () => void;
}

export const ElevatorScene: React.FC<ElevatorSceneProps> = ({ onReachClubFloor }) => {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [isMoving, setIsMoving] = useState(false);
  const [showFloorButtons, setShowFloorButtons] = useState(true);

  const goToFloor = (floor: number) => {
    if (isMoving || floor === currentFloor) return;
    
    setIsMoving(true);
    setShowFloorButtons(false);
    
    setTimeout(() => {
      setCurrentFloor(floor);
      setIsMoving(false);
      
      if (floor === 5) {
        setTimeout(() => {
          onReachClubFloor();
        }, 1500);
      } else {
        setShowFloorButtons(true);
      }
    }, 2000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-amber-900/20 to-black">
      {/* Elevator walls */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-800/30 via-amber-700/20 to-amber-800/30" />
      
      {/* Wood paneling effect */}
      <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-amber-900/40 to-amber-800/40" />
      <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-amber-900/60 to-transparent" />
      <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-amber-900/60 to-transparent" />
      
      {/* Elevator ceiling light */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gradient-to-b from-yellow-200/60 to-yellow-400/30 rounded-lg">
        <div className={`absolute inset-0 rounded-lg ${isMoving ? 'animate-pulse' : 'animate-pulse'}`} 
             style={{ animationDuration: isMoving ? '0.1s' : '2s' }} />
      </div>
      
      {/* Floor indicator */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg p-4 border border-amber-600/50">
        <div className="text-center">
          <div className="text-amber-400 text-sm font-medium mb-2">FLOOR</div>
          <div className="text-white text-4xl font-bold font-mono">
            {isMoving ? (
              <div className="animate-pulse">...</div>
            ) : (
              currentFloor === 5 ? 'B1' : currentFloor.toString().padStart(2, '0')
            )}
          </div>
        </div>
      </div>
      
      {/* Elevator panel */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-black/90 rounded-lg p-6 border border-amber-600/30">
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((floor) => (
            <button
              key={floor}
              onClick={() => goToFloor(floor)}
              disabled={isMoving || !showFloorButtons}
              className={`w-10 h-10 rounded-full border text-sm font-medium transition-all duration-300 ${
                floor === currentFloor
                  ? 'bg-amber-500 border-amber-400 text-black'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
              } ${(!showFloorButtons || isMoving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {floor}
            </button>
          ))}

          {/* Club floor button (B1) */}
          <button
            onClick={() => goToFloor(5)}
            disabled={isMoving || !showFloorButtons}
            className={`h-10 rounded-full border text-sm font-medium transition-all duration-300 ${
              currentFloor === 5
                ? 'bg-purple-500 border-purple-400 text-white animate-pulse'
                : 'bg-gray-800 border-purple-500/50 text-purple-400 hover:bg-purple-900/30'
            } ${(!showFloorButtons || isMoving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            CLUB (B1)
          </button>
        </div>
      </div>

      {/* Elevator movement indicator */}
      {isMoving && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className="flex flex-col space-y-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}
      
      {/* Status display */}
      {isMoving && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg px-6 py-3 border border-amber-600/50">
          <div className="text-amber-400 text-center font-medium">
            {currentFloor === 5 ? 'Descending to Club...' : `Moving to Floor ${currentFloor === 5 ? 'B1' : currentFloor}...`}
          </div>
        </div>
      )}
      
      {/* Ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-yellow-500/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};