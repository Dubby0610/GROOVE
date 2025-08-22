import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThreeNightClubScene from "./ThreeNightClubScene";
import { LoadingScreen } from "./LoadingScreen";
import { apiFetch } from "../utils/apiFetch";
import { useNightclubMusic } from "../hooks/useNightclubMusic";

const FLOOR_LABELS = [
  "1st floor - Party Vibes",
  "2nd floor - Boogie Wonderland",
  "3rd floor - For The Sexy People",
  "4th floor - Late Night Agenda",
];

interface NightClubSceneProps {
  floor: number;
}

const NightClubScene: React.FC<NightClubSceneProps> = ({ floor }) => {
  // Nightclub music hook
  const { 
    playDanceMusic, 
    stopDanceMusic, 
    setVolume, 
    getVolume, 
    toggleMusic,
    getAudioLevels,
    audioState 
  } = useNightclubMusic('/sounds/floor_1_1.mp3');
  
  // Format time helper function
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // Fetch subscription on mount to get remaining time for hourly plan
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/user/subscription`);
        if (!res.ok) return;
        const sub = await res.json();
        if (sub.plan === "onehour" && typeof sub.remaining_time_seconds === "number") {
          setRemaining(sub.remaining_time_seconds);
        }
      } catch {}
    };
    load();
  }, []);

  // Start timer only after 3D models are loaded
  const handleModelsLoaded = () => {
    setIsLoading(false);
    setTimerStarted(true);
    // Start dance music when club is loaded
    playDanceMusic();
  };

  // Tick every minute to update backend and UI (only after models are loaded)
  useEffect(() => {
    if (!timerStarted || remaining === null) return;
    if (remaining <= 0) return;
    
    // start interval aligned to minutes
    const tick = async () => {
      try {
        const res = await apiFetch(`/payment/update-remaining`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: 1 })
        });
        if (res.ok) {
          const data = await res.json();
          const newRemaining = data.remaining_time_seconds;
          setRemaining(newRemaining);
          
          // Auto-logout when time reaches 0
          if (newRemaining <= 0) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            navigate('/sign-out', { state: { reason: 'time_expired' } });
          }
        }
      } catch {}
    };
    
    timerRef.current = window.setInterval(tick, 60 * 1000) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [remaining, timerStarted, navigate]);

  // Cleanup: stop music when component unmounts
  useEffect(() => {
    return () => {
      stopDanceMusic();
    };
  }, [stopDanceMusic]);

  // Handle manual logout
  const handleLogout = async () => {
    try {
      await apiFetch(`/payment/cancel`, { method: "POST" });
    } finally {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setRemaining(0);
      stopDanceMusic(); // Stop music when logging out
      navigate('/sign-out', { state: { reason: 'manual_logout' } });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ThreeNightClubScene floor={floor} onLoaded={handleModelsLoaded} />
      {isLoading && (
        <LoadingScreen message="Loading your club experience..." />
      )}
      {remaining !== null && timerStarted && (
        <div className="absolute top-6 right-6 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
          Time left: {Math.max(0, Math.floor(remaining / 60))}m
        </div>
      )}
      
      {/* Beautiful Music Visualizer - Center Bottom */}
      {!isLoading && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
              <div className="relative bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl min-w-[360px] overflow-hidden">
                         {/* Glowing border effect */}
             <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-50 blur-sm" />
             {/* Music Progress Bar */}
             <div className="flex items-center justify-center gap-3 h-12">
               {/* Current Time */}
               <div className="text-white/80 text-sm font-mono min-w-[40px] text-right">
                 {formatTime(audioState.currentTime)}
               </div>
               
               {/* Progress Bar */}
               <div className="relative flex-1 max-w-[200px]">
                 <div 
                   className="w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer relative"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const clickX = e.clientX - rect.left;
                     const percentage = clickX / rect.width;
                     const newTime = percentage * audioState.duration;
                     if (audioState.isPlaying && newTime >= 0 && newTime <= audioState.duration) {
                       // Update audio time (this would need to be implemented in the hook)
                       console.log('Seek to:', newTime);
                     }
                   }}
                 >
                   {/* Progress Fill */}
                   <div 
                     className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-100 ease-out"
                     style={{
                       width: `${audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}%`
                     }}
                   />
                 </div>
                 
                 {/* Progress Handle */}
                 <div 
                   className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
                   style={{
                     left: `${audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}%`,
                     transform: 'translate(-50%, -50%)'
                   }}
                 />
               </div>
               
               {/* Total Duration */}
               <div className="text-white/80 text-sm font-mono min-w-[40px] text-left">
                 {formatTime(audioState.duration)}
               </div>
             </div>
                         
             {/* Professional Controls Row */}
             <div className="flex items-center justify-center gap-4 mt-4">
               {/* Enhanced Play/Pause Button */}
               <button
                 onClick={toggleMusic}
                 className="group relative w-10 h-10 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-600 hover:from-pink-600 hover:via-purple-700 hover:to-pink-700 rounded-full flex items-center justify-center text-white text-lg font-bold transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-purple-500/50"
                 style={{
                   boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)'
                 }}
               >
                 <div className="relative z-10">
                   {audioState.isPlaying ? '⏸️' : '▶️'}
                 </div>
                 {/* Ripple effect */}
                 <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300" />
               </button>
               
               {/* Enhanced Volume Slider */}
               <div className="flex items-center gap-3">
                 <span className="text-white/80 text-sm">🔊</span>
                 <div className="relative">
                   <input
                     type="range"
                     min="0"
                     max="1"
                     step="0.01"
                     value={getVolume()}
                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                     className="w-20 h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                     style={{
                       background: `linear-gradient(to right, 
                         #ec4899 0%, 
                         #ec4899 ${getVolume() * 100}%, 
                         rgba(255,255,255,0.3) ${getVolume() * 100}%, 
                         rgba(255,255,255,0.3) 100%)`
                     }}
                   />
                   {/* Volume level indicator */}
                   <div className="absolute -bottom-5 left-0 text-center w-full">
                     <span className="text-white/60 text-xs font-mono">
                       {Math.round(getVolume() * 100)}%
                     </span>
                   </div>
                 </div>
               </div>
               
               {/* Enhanced Status Indicator */}
               <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${audioState.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} shadow-lg`}></div>
                 <span className="text-white/80 text-sm font-semibold tracking-wide">
                   {audioState.isPlaying ? 'LIVE' : 'PAUSED'}
                 </span>
               </div>
             </div>
                         
             {/* Professional Floor Label */}
             <div className="text-center mt-4">
               <div className="text-white/70 text-sm font-medium">🎵 Live Music Experience</div>
             </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handleLogout}
        className="absolute top-6 left-6 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default NightClubScene;