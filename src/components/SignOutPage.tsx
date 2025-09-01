import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface SignOutPageProps {
  reason?: "time_expired" | "manual_logout" | "session_expired" | "auth_failed";
}

export const SignOutPage: React.FC<SignOutPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reason = location.state?.reason || "session_expired";

  useEffect(() => {
    // Stop any playing music immediately
    const stopAllMusic = () => {
      // Stop any audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (audio instanceof HTMLAudioElement) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      
      // Also try to stop any AudioContext if it exists
      if (window.AudioContext || (window as any).webkitAudioContext) {
        // This will stop any Web Audio API audio
        console.log('🎵 Stopping all music on signout page');
      }
    };

    stopAllMusic();

    // Check if user is still authenticated (shouldn't be, but just in case)
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      // User is still authenticated, redirect to main page
      navigate('/');
      return;
    }

    // Clear all stored data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    localStorage.removeItem("id");
    localStorage.removeItem("selectedClubFloor");
  }, [navigate]);

  const getMessage = () => {
    switch (reason) {
      case "time_expired":
        return "Your club time has expired!";
      case "manual_logout":
        return "You've been signed out of the club.";
      case "auth_failed":
        return "Authentication failed.";
      case "session_expired":
      default:
        return "Your session has expired.";
    }
  };

  const getSubMessage = () => {
    switch (reason) {
      case "time_expired":
        return "Thanks for partying with us! Come back soon for more groovy nights.";
      case "manual_logout":
        return "Hope you enjoyed your time at the club!";
      case "auth_failed":
        return "Please sign in again to continue your club experience.";
      case "session_expired":
      default:
        return "Please sign in again to continue your club experience.";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] backdrop-blur-md">
      <div className="relative max-w-md w-full p-8 rounded-3xl shadow-2xl border-4 border-[#2af598] bg-[#181c2b] overflow-hidden animate-fade-in">
        {/* Neon Door Frame */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 rounded-3xl border-8 border-[#2af598] opacity-60 animate-pulse blur-xl" />
          <div className="absolute inset-0 rounded-3xl border-4 border-[#009efd] opacity-40 animate-pulse blur-2xl" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-6 flex flex-col items-center">
            <div className="text-5xl mb-4 animate-bounce text-[#2af598] drop-shadow-neon">🚪</div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#2af598] to-[#009efd] bg-clip-text text-transparent mb-4 text-center drop-shadow-neon">
              {getMessage()}
            </h2>
            <div className="text-base text-cyan-200 text-center font-mono tracking-wide animate-fade-in-slow">
              {getSubMessage()}
            </div>
          </div>
          
          <div className="mb-8 w-full">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-[#2af598] to-[#009efd] hover:from-[#009efd] hover:to-[#2af598] text-black font-extrabold py-3 px-4 rounded-2xl shadow-xl text-xl tracking-wider transition-all duration-200 drop-shadow-neon animate-glow"
            >
              Return to Entrance
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>Need more club time?</p>
            <p className="text-[#2af598] font-semibold">Get a new subscription!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignOutPage;
