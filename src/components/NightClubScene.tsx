import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThreeNightClubScene from "./ThreeNightClubScene";
import { LoadingScreen } from "./LoadingScreen";
import { apiFetch } from "../utils/apiFetch";

// Floor labels (for future use)
// const FLOOR_LABELS = [
//   "1st floor - Party Vibes",
//   "2nd floor - Boogie Wonderland", 
//   "3rd floor - For The Sexy People",
//   "4th floor - Late Night Agenda",
// ];

interface NightClubSceneProps {
  floor: number;
}

const NightClubScene: React.FC<NightClubSceneProps> = ({ floor }) => {
  // Simple audio reference like the working scenes
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Format time helper function
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format expire date helper function
  const formatExpireDate = (endDate: string): string => {
    const date = new Date(endDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const [authWarning, setAuthWarning] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Fetch subscription on mount to get remaining time for hourly plan and end date for one-day plan
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/user/subscription`);
        if (!res.ok) return;
        const sub = await res.json();
        setSubscriptionData(sub);
        if (sub.plan === "onehour" && typeof sub.remaining_time_seconds === "number") {
          setRemaining(sub.remaining_time_seconds);
        }
      } catch {}
    };
    load();
  }, []);

  // Start timer only after 3D models are loaded
  const handleModelsLoaded = () => {
    console.log('🏗️ 3D models loaded - setting up nightclub');
    setIsLoading(false);
    setTimerStarted(true);
    
    // Stop any preserved background music from previous scenes
    const stopPreservedBackgroundMusic = () => {
      console.log('🛑 Stopping preserved background music for nightclub...');
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
    
    // Stop preserved background music before starting nightclub music
    stopPreservedBackgroundMusic();
    
    // Start DJ Barry audio 2 seconds after models are loaded
    setTimeout(() => {
      console.log('🎵 Starting DJ Barry audio 2 seconds after models loaded');
      const djBarryAudio = new Audio('/sounds/Dj_Barry_dancefloor line.mp3');
      djBarryAudio.volume = 0.9;
      djBarryAudio.loop = false;
      
      // Store globally so it doesn't stop when component unmounts
      (window as any).djBarryAudio = djBarryAudio;
      
      // Add event listener to mark as finished when it ends
      djBarryAudio.addEventListener('ended', () => {
        console.log('✅ DJ Barry audio finished playing completely');
        (window as any).djBarryAudio = null;
      });
      
      djBarryAudio.play()
        .then(() => {
          console.log('✅ DJ Barry audio started 2 seconds after models loaded!');
        })
        .catch((error) => {
          console.log('⚠️ DJ Barry autoplay blocked:', error.message);
        });
    }, 2000);
    
    // Start music automatically like the working scenes
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        console.log('✅ Nightclub music started automatically!');
      }).catch(() => {
        console.log('⚠️ Auto-play blocked, music will start on user interaction');
      });
    }
  };

  // Update time and duration for the music controller
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Simple music control functions
  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const setMusicVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  };

  const seekTo = (timeInSeconds: number) => {
    if (!audioRef.current || !duration) return;
    
    const clampedTime = Math.max(0, Math.min(timeInSeconds, duration));
    audioRef.current.currentTime = clampedTime;
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
          setAuthWarning(false); // Clear warning on success
          
          // Auto-logout when time reaches 0
          if (newRemaining <= 0) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            navigate('/sign-out', { state: { reason: 'time_expired' } });
          }
        } else if (res.status === 401 || res.status === 403) {
          // Authentication error - show warning and try to refresh token
          console.log('🔄 Authentication error, attempting token refresh...');
          setAuthWarning(true);
          
          try {
            // Wait a bit for token refresh to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Retry the request
            const retryRes = await apiFetch(`/payment/update-remaining`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ minutes: 1 })
            });
            
            if (retryRes.ok) {
              const data = await retryRes.json();
              const newRemaining = data.remaining_time_seconds;
              setRemaining(newRemaining);
              setAuthWarning(false); // Clear warning on success
              
              if (newRemaining <= 0) {
                if (timerRef.current) window.clearInterval(timerRef.current);
                navigate('/sign-out', { state: { reason: 'time_expired' } });
              }
            } else {
              // Still failing after refresh, redirect to login
              console.error('❌ Authentication failed after token refresh');
              setAuthWarning(false);
              if (timerRef.current) window.clearInterval(timerRef.current);
              navigate('/sign-out', { state: { reason: 'auth_failed' } });
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            setAuthWarning(false);
            if (timerRef.current) window.clearInterval(timerRef.current);
            navigate('/sign-out', { state: { reason: 'auth_failed' } });
          }
        } else {
          console.error('❌ Payment update failed:', res.status, res.statusText);
          // Don't stop the timer for other errors, just log them
        }
      } catch (error) {
        console.error('❌ Timer tick error:', error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          console.log('🔄 Authentication error detected, redirecting to login...');
          setAuthWarning(false);
          if (timerRef.current) window.clearInterval(timerRef.current);
          navigate('/sign-out', { state: { reason: 'auth_failed' } });
        } else {
          // For other errors, just log but don't stop the timer
          console.log('⚠️ Non-critical error, continuing timer...');
        }
      }
    };
    
    timerRef.current = window.setInterval(tick, 60 * 1000) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [remaining, timerStarted, navigate]);

  // Cleanup: stop music when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Handle manual logout
  const handleLogout = () => {
    // Just show the confirmation dialog - don't clear any data yet
      setShowLogoutConfirm(true);
  };

  const handleConfirmedLogout = async () => {
    try {
      // Stop all audio aggressively
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = ''; // Clear source to prevent browser media controls
        audioRef.current.load();
      }
      
      // Stop any global audio references
      if ((window as any).djBarryAudio) {
        (window as any).djBarryAudio.pause();
        (window as any).djBarryAudio.currentTime = 0;
        (window as any).djBarryAudio.src = '';
        (window as any).djBarryAudio = null;
      }
      
      // Clear media session metadata
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
      
      // Clear the timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Clear local storage and session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Navigate to sign-out page
      navigate('/sign-out', { state: { reason: 'manual_logout' } });
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Even if there's an error, still navigate to sign-out page
      navigate('/sign-out', { state: { reason: 'manual_logout' } });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background music for nightclub - Simple approach like working scenes */}
      <audio
        ref={audioRef}
        src="/sounds/floor_1_1.mp3"
        loop
        style={{ display: 'none' }}
      />
      
      <ThreeNightClubScene floor={floor} onLoaded={handleModelsLoaded} />
      {isLoading && (
        <LoadingScreen />
      )}
      {/* Enhanced Logout Button - Moved to top-right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={handleLogout}
          className="relative px-4 py-2 rounded-xl font-bold transition-all duration-500 shadow-2xl hover:shadow-3xl flex items-center justify-center border-2 overflow-hidden group bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 border-red-400 hover:border-red-300 cursor-pointer transform hover:scale-110 active:scale-95"
          style={{
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(239,68,68,0.4), 0 0 20px rgba(239,68,68,0.2)'
          }}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 transition-transform duration-700 group-hover:translate-x-full" />
          
          {/* Text with enhanced styling */}
          <span className="relative z-10 font-bold transition-all duration-300 text-white" style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontSize: '1rem'
          }}>
            Signout
          </span>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100" style={{
            background: 'radial-gradient(circle at center, rgba(239,68,68,0.3) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }} />
        </button>
      </div>

      {/* Timer/Expire Date - Moved to top-left */}
      {timerStarted && (
        <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
          {subscriptionData?.plan === "onehour" && remaining !== null ? (
            <>Time left: {Math.max(0, Math.floor(remaining / 60))}m</>
          ) : subscriptionData?.plan === "oneday" && subscriptionData?.end_date ? (
            <>Expires: {formatExpireDate(subscriptionData.end_date)}</>
          ) : null}
        </div>
      )}
      
      {/* Authentication Warning */}
      {authWarning && (
        <div className="absolute top-16 right-6 bg-orange-600/80 text-white px-4 py-2 rounded-lg text-sm animate-pulse">
          ⚠️ Authentication issue detected
        </div>
      )}
      
      {/* Music should start automatically now */}

      {/* Beautiful Music Visualizer - Center Bottom */}
      {!isLoading && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 hidden">
          <div className="relative bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl min-w-[360px] overflow-hidden">
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-50 blur-sm" />
            
            {/* Music Progress Bar */}
            <div className="flex items-center justify-center gap-3 h-12">
              {/* Current Time */}
              <div className="text-white/80 text-sm font-mono min-w-[40px] text-right">
                {formatTime(currentTime)}
              </div>
                
              {/* Progress Bar */}
              <div className="relative flex-1 max-w-[200px]">
                <div 
                  className="w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    const newTime = percentage * duration;
                    if (newTime >= 0 && newTime <= duration) {
                      seekTo(newTime);
                    }
                  }}
                >
                  {/* Progress Fill */}
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-100 ease-out"
                    style={{
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                    }}
                  />
                </div>
                 
                {/* Progress Handle */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-pink-200"
                  style={{
                    left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                  }}
                />
              </div>
               
              {/* Total Duration */}
              <div className="text-white/80 text-sm font-mono min-w-[40px] text-left">
                {formatTime(duration)}
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
                  {isPlaying ? '⏸️' : '▶️'}
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
                    value={volume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-20 h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, 
                        #ec4899 0%, 
                        #ec4899 ${volume * 100}%, 
                        rgba(255,255,255,0.3) ${volume * 100}%, 
                        rgba(255,255,255,0.3) 100%)`
                    }}
                  />
                  {/* Volume level indicator */}
                  <div className="absolute -bottom-5 left-0 text-center w-full">
                    <span className="text-white/60 text-xs font-mono">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
               
              {/* Enhanced Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} shadow-lg`}></div>
              </div>
            </div>
                        
            {/* Professional Floor Label */}
            <div className="text-center mt-4">
              <div className="text-white/70 text-sm font-medium">🎵 Live Music Experience</div>
            </div>
          </div>
        </div>
      )}
      

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/80 border border-white/20 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🚪</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Leave the Club?
              </h3>
              <p className="text-white/80 mb-6">
                Are you sure you want to sign out? Your session will end and you'll need to sign in again.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedLogout}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NightClubScene;