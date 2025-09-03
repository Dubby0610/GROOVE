import React, { useState, useEffect, useRef } from "react";
import PaymentModal from "./PaymentModal";
import { AuthModal } from "./AuthModal";
import LoginModal from "./LoginModal";
import { apiFetch } from "../utils/apiFetch";

const FLOOR_IMAGES = [
  "/imgs/1st.png",
  "/imgs/2nd.png",
  "/imgs/3rd.png",
  "/imgs/4th.png",
];

// const FLOOR_LABELS = [
//   "1st floor - Party Vibes",
//   "2nd floor - Boogie Wonderland",
//   "3rd floor - For The Sexy People",
//   "4th floor - Late Night Agenda",
// ];

const FLOOR_THEMES = [
  "#06f6f6", // 1st floor - cyan
  "#a259f7", // 2nd floor - purple
  "#f759a2", // 3rd floor - pink
  "#59a2f7", // 4th floor - blue
];

interface ClubDoorSceneProps {
  clubFloor: number | null;
  onEnterClub: () => void;
  playDJVoiceOver: () => void;
}

export const ClubDoorScene: React.FC<ClubDoorSceneProps> = ({
  clubFloor,
  onEnterClub,
  playDJVoiceOver,
}) => {
  // Derive info from clubFloor
  const idx = clubFloor ? (clubFloor - 1) % FLOOR_IMAGES.length : 0;
  const clubImage = FLOOR_IMAGES[idx];
  const themeColor = FLOOR_THEMES[idx];

  const [pulseIntensity, setPulseIntensity] = useState(0.5);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [djHovered, setDjHovered] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryPeriod, setEntryPeriod] = useState<{
    start: string;
    end: string;
  } | null>(null);

  // Auth and subscription state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Audio refs for background music
  const welcomeMusicRef = useRef<HTMLAudioElement | null>(null);
  const paymentMusicRef = useRef<HTMLAudioElement | null>(null);

  // DJ voiceover plays automatically when arriving at club door
  const [hasPlayedVoiceover, setHasPlayedVoiceover] = useState(false);
  
  const playDJVoiceOverOnce = () => {
    if (!hasPlayedVoiceover) {
      playDJVoiceOver(); // This plays voiceover.mp3
      setHasPlayedVoiceover(true);
    }
  };

  useEffect(() => {
    // Simulate music-driven lighting pulse
    const interval = setInterval(() => {
      setPulseIntensity(Math.random() * 0.5 + 0.3);
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [clubFloor]);

  // Initialize and manage background music and voiceover
  useEffect(() => {
    // Start welcome music when component mounts with higher volume
    if (welcomeMusicRef.current) {
      welcomeMusicRef.current.volume = 0.5; // Increased from 0.3 to 0.5
      welcomeMusicRef.current.play().catch(console.error);
    }

    // Play DJ voiceover after 1.5 seconds with lower volume
    const voiceoverTimer = setTimeout(() => {
      playDJVoiceOverOnce();
    }, 1500); // Changed from 500ms to 1500ms (1.5 seconds)

    return () => {
      clearTimeout(voiceoverTimer);
      // Cleanup audio on unmount
      if (welcomeMusicRef.current) {
        welcomeMusicRef.current.pause();
        welcomeMusicRef.current.currentTime = 0;
      }
      if (paymentMusicRef.current) {
        paymentMusicRef.current.pause();
        paymentMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  // Check auth on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setAuthModalOpen(true);
      setIsAuthenticated(false);
      setShowWelcomeMessage(false);
      return;
    }
    // Validate token and fetch user/subscription
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    setShowWelcomeMessage(false);
    setCheckingSub(true);
    apiFetch("/user/subscription", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res: any) => res.json())
      .then((data: any) => {
        setSubscription(data);
        setCheckingSub(false);
        setShowWelcomeMessage(true);
      })
      .catch(() => {
        setSubscription(null);
        setCheckingSub(false);
        setShowWelcomeMessage(false);
      });
  }, [clubFloor, playDJVoiceOver]);

  // Handle auth success
  const handleAuthSuccess = (
    user: any,
    tokens: { accessToken: string; refreshToken: string }
  ) => {
    setUser(user);
    localStorage.setItem("email", user.email);
    localStorage.setItem("id", user.id);
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    setShowWelcomeMessage(false);
    setCheckingSub(true);
    apiFetch("/user/subscription", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
      .then((res: any) => res.json())
      .then((data: any) => {
        setSubscription(data);
        setCheckingSub(false);
        setShowWelcomeMessage(true);
      })
      .catch(() => {
        setSubscription(null);
        setCheckingSub(false);
        setShowWelcomeMessage(false);
      });
  };

  const handleEnterClub = () => {
    setShowWelcomeMessage(false);
    onEnterClub();
  };

  // Handle user sign out
  const handleSignOut = async () => {
    // Prevent signout during critical operations
    if (checkingSub || showPaymentModal || showEntryModal) {
      alert("Please wait for the current operation to complete before signing out.");
      return;
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to sign out? This will end your current session and you'll need to log in again."
    );
    
    if (!confirmed) return;
    
    setIsSigningOut(true);
    
    try {
      // If there's an active access token, try to invalidate it on the backend
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (accessToken || refreshToken) {
        try {
          await apiFetch("/auth/logout", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
              token: accessToken,
              refreshToken: refreshToken 
            })
          });
        } catch (error) {
          console.warn("Failed to invalidate token on backend:", error);
          // Continue with logout even if backend call fails
        }
      }
      
      // Clear all local storage
      localStorage.clear();
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Reset all component state
      setIsAuthenticated(false);
      setUser(null);
      setSubscription(null);
      setAuthModalOpen(false);
      setShowPaymentModal(false);
      setShowEntryModal(false);
      setShowWelcomeMessage(false);
      setCheckingSub(false);
      setJustPaid(false);
      setEntryPeriod(null);
      setDjHovered(false);
      
      // Redirect to first page (landing page)
      window.location.href = "/club-door";
      
    } catch (error) {
      console.error("Error during sign out:", error);
      setIsSigningOut(false);
      // Force logout even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/club-door";
    }
  };

  // Removed: clubTitle extraction not needed

  // On DJ Voice-over message click
  const handleDJClick = () => {
    // First, refresh subscription data to ensure we have the latest status
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setAuthModalOpen(true);
      return;
    }

    // If user just paid, don't show payment modal again
    if (justPaid) {
      console.log("User just paid, waiting for subscription to be processed");
      return;
    }

    // If we already have a valid subscription, use it instead of fetching again
    if (subscription && subscription.status === "active") {
      // Check if subscription is still valid
      if (subscription.plan === "onehour") {
        if (subscription.remaining_time_seconds > 0) {
          setEntryPeriod({
            start: subscription.start_date || new Date().toISOString(),
            end: subscription.end_date,
          });
          setShowEntryModal(true);
          return;
        }
      } else {
        // For other plans (oneday), check end date
        const now = new Date();
        const end = new Date(subscription.end_date);
        if (end > now) {
          setEntryPeriod({
            start: subscription.start_date || new Date().toISOString(),
            end: subscription.end_date,
          });
          setShowEntryModal(true);
          return;
        }
      }
    }

    // Only fetch fresh data if we don't have a valid subscription
    setCheckingSub(true);
    apiFetch("/user/subscription", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res: any) => res.json())
      .then((data: any) => {
        setSubscription(data);
        setCheckingSub(false);

        // Now check subscription status
        if (data && data.status === "active") {
          // For onehour plans, check remaining time
          if (data.plan === "onehour") {
            if (data.remaining_time_seconds > 0) {
              // Set entry period for onehour plan (will show remaining time in modal)
              setEntryPeriod({
                start: data.start_date || new Date().toISOString(),
                end: data.end_date,
              });
              setShowEntryModal(true);
              return;
            }
          } else {
            // For other plans (oneday), check end date
            const now = new Date();
            const end = new Date(data.end_date);
            if (end > now) {
              // Active subscription - show login modal
              setEntryPeriod({
                start: data.start_date || new Date().toISOString(),
                end: data.end_date,
              });
              setShowEntryModal(true);
              return;
            }
          }
        }
        // No subscription or inactive/expired - show payment modal
        setShowPaymentModal(true);
      })
      .catch(() => {
        setCheckingSub(false);
        // Only show payment modal if we don't have any existing subscription data
        if (!subscription) {
          setShowPaymentModal(true);
        } else {
          // If we have existing subscription data but API call failed, 
          // don't show payment modal - user might still have access
          console.warn("Failed to refresh subscription, using cached data");
        }
      });
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${clubImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background music elements */}
      <audio
        ref={welcomeMusicRef}
        src="/sounds/In elevator and _Welcome..._ page groove.mp3"
        loop
        style={{ display: 'none' }}
      />
      <audio
        ref={paymentMusicRef}
        src="/sounds/Payment_details_groove.mp3"
        loop
        style={{ display: 'none' }}
      />
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
        themeColor={themeColor}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: pulseIntensity }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Sound visualization bars */}
      <div className="absolute bottom-20 left-8 flex space-x-1 items-end">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-4 bg-gradient-to-t from-purple-500 to-pink-500"
            style={{
              height: `${Math.random() * 40 + 10}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.8 + Math.random() * 0.6}s`,
              animation: `soundBarGrowUp ${0.8 + Math.random() * 0.6}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-20 right-8 flex space-x-1 items-end">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-4 bg-gradient-to-t from-cyan-500 to-blue-500"
            style={{
              height: `${Math.random() * 30 + 15}px`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.8 + Math.random() * 0.6}s`,
              animation: `soundBarGrowUp ${0.8 + Math.random() * 0.6}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Simplified DJ modal - only microphone and click message */}
      {((isAuthenticated && showWelcomeMessage && !authModalOpen) || (!showPaymentModal && !authModalOpen)) && (
        <div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
          onMouseEnter={() => setDjHovered(true)}
          onMouseLeave={() => setDjHovered(false)}
          onClick={checkingSub ? undefined : handleDJClick}
          style={{ cursor: checkingSub ? "not-allowed" : "pointer" }}
        >
          <div className="text-center flex flex-col items-center">
            {/* Large animated microphone icon */}
            <div
              className={`text-8xl mb-6 transition-all duration-700 ${
                djHovered ? "text-cyan-600" : "text-purple-300"
              }`}
              style={{
                filter: djHovered ? "drop-shadow(0 0 20px rgba(34,211,238,0.6))" : "drop-shadow(0 0 15px rgba(168,85,247,0.5))",
                transform: djHovered ? "scale(1.1) translateY(-8px)" : "scale(1) translateY(0)",
                animation: djHovered ? "microphoneFloat 3s ease-in-out infinite" : "none",
                transition: "all 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              🎤
            </div>
            
            {/* Click message only */}
            <div className={`text-lg font-semibold transition-colors duration-300 ${
              djHovered ? "text-cyan-300" : "text-purple-300"
            }`}>
              {checkingSub ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Checking access...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 animate-pulse">
                  <span>Click here to enter!</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* If authenticated, show subscription/enter/payment logic
      {isAuthenticated && !authModalOpen && showWelcomeMessage && (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-30">
          {checkingSub ? (
            <div className="text-white bg-black/70 px-6 py-3 rounded-xl">Checking subscription...</div>
          ) : subscription && subscription.status === 'active' ? (
            <div className="flex flex-col items-center">
              <div className="text-green-400 font-bold mb-2">Subscription: {subscription.plan} (until {subscription.end_date?.slice(0, 10)})</div>
              <button
                className="bg-cyan-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-cyan-600"
                onClick={handleEnterClub}
              >Enter</button>
            </div>
          ) : (
            <PaymentModal open={true} onOpenChange={() => {}} />
          )}
        </div>
      )} */}

      {/* Guest count display */}
      <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-sm rounded-lg p-3">
        <div className="text-cyan-400 text-sm font-medium">Guests Tonight</div>
        <div className="text-white text-2xl font-bold">247</div>
      </div>

      {/* Enhanced Sign Out Button */}
      {isAuthenticated && (
        <div className="absolute top-6 right-6">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`relative px-6 py-3 rounded-xl font-bold transition-all duration-500 shadow-2xl hover:shadow-3xl flex items-center space-x-3 border-2 overflow-hidden group ${
              isSigningOut 
                ? "bg-gradient-to-r from-gray-600 to-gray-500 border-gray-400 cursor-not-allowed opacity-80" 
                : "bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 border-red-400 hover:border-red-300 cursor-pointer transform hover:scale-110 active:scale-95"
            }`}
            style={{
              backdropFilter: 'blur(10px)',
              boxShadow: isSigningOut 
                ? '0 10px 25px rgba(0,0,0,0.3)' 
                : '0 10px 30px rgba(239,68,68,0.4), 0 0 20px rgba(239,68,68,0.2)'
            }}
          >
            {/* Animated background effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 transition-transform duration-700 ${
              isSigningOut ? 'opacity-0' : 'group-hover:translate-x-full'
            }`} />
            
            {/* Text with enhanced styling */}
            <span className={`relative z-10 font-bold transition-all duration-300 ${
              isSigningOut ? 'text-gray-200' : 'text-white'
            }`} style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontSize: '1.1rem'
            }}>
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </span>
            
            {/* Hover glow effect */}
            <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
              isSigningOut ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
            }`} style={{
              background: 'radial-gradient(circle at center, rgba(239,68,68,0.3) 0%, transparent 70%)',
              filter: 'blur(8px)'
            }} />
          </button>
        </div>
      )}

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={(open) => {
          setShowPaymentModal(open);
          
          // Handle music transitions
          if (open) {
            // Payment modal opening: fade out welcome music, fade in payment music
            if (welcomeMusicRef.current) {
              welcomeMusicRef.current.volume = 0.1; // Lower volume
            }
            if (paymentMusicRef.current) {
              paymentMusicRef.current.volume = 0.3; // Normal volume
              paymentMusicRef.current.play().catch(console.error);
            }
          } else {
            // Payment modal closing: fade out payment music, fade in welcome music
            if (paymentMusicRef.current) {
              paymentMusicRef.current.volume = 0.0; // Fade out
              setTimeout(() => {
                if (paymentMusicRef.current) {
                  paymentMusicRef.current.pause();
                  paymentMusicRef.current.currentTime = 0;
                }
              }, 1000);
            }
            if (welcomeMusicRef.current) {
              welcomeMusicRef.current.volume = 0.3; // Restore normal volume
            }
          }
          
          // If payment modal is closing, refresh subscription data
          if (!open && isAuthenticated) {
            setJustPaid(true); // Mark that user just paid
            const accessToken = localStorage.getItem("accessToken");
            if (accessToken) {
              setCheckingSub(true);
              apiFetch("/user/subscription", {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
                .then((res: any) => res.json())
                .then((data: any) => {
                  setSubscription(data);
                  setCheckingSub(false);
                  setShowWelcomeMessage(true);
                  // Reset the justPaid flag after a delay
                  setTimeout(() => setJustPaid(false), 5000);
                })
                .catch(() => {
                  setCheckingSub(false);
                  // Keep existing subscription data if refresh fails
                  setTimeout(() => setJustPaid(false), 5000);
                });
            }
          }
        }}
        subscription={subscription}
      />

      {/* Entry Modal */}
      {showEntryModal && entryPeriod && (
        <LoginModal
          open={showEntryModal}
          onOpenChange={(open) => {
            setShowEntryModal(open);
            if (!open) setShowWelcomeMessage(true);
          }}
          period={entryPeriod}
          onLogin={handleEnterClub}
          user={user}
          subscription={subscription}
        />
      )}
    </div>
  );
};
