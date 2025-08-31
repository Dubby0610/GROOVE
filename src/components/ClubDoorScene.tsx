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

const FLOOR_LABELS = [
  "1st floor - Party Vibes",
  "2nd floor - Boogie Wonderland",
  "3rd floor - For The Sexy People",
  "4th floor - Late Night Agenda",
];

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

  // Restored: DJ voiceover should work at club door (this was working fine)
  const [hasPlayedVoiceover, setHasPlayedVoiceover] = useState(false);
  
  const playDJVoiceOverOnce = () => {
    if (!hasPlayedVoiceover) {
      playDJVoiceOver(); // This plays voiceover.mp3 (which should work)
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

  // Initialize and manage background music
  useEffect(() => {
    // Start welcome music when component mounts
    if (welcomeMusicRef.current) {
      welcomeMusicRef.current.volume = 0.3;
      welcomeMusicRef.current.play().catch(console.error);
    }

    return () => {
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
        // Play DJ voice-over when welcome message shows after auth check (only once)
        playDJVoiceOverOnce();
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
        // Play DJ voice-over when welcome message shows after successful auth (only once)
        playDJVoiceOverOnce();
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
        src="/sounds/welcome..._ page_groove.mp3"
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

      {/* DJ Voice-over modal only if authenticated and not showing auth modal */}
      {((isAuthenticated && showWelcomeMessage && !authModalOpen) || (!showPaymentModal && !authModalOpen)) && (
        <div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-sm mx-4 z-20"
          onMouseEnter={() => setDjHovered(true)}
          onMouseLeave={() => setDjHovered(false)}
          onClick={checkingSub ? undefined : handleDJClick}
          style={{ cursor: checkingSub ? "not-allowed" : "pointer" }}
        >
          <div
            className={`rounded-3xl p-8 border-4 transition-all duration-300 animate-fade-in
              ${
                djHovered
                  ? "bg-gradient-to-br from-cyan-100/95 via-purple-50/95 to-pink-100/95 border-cyan-400 shadow-2xl ring-8 ring-cyan-300/30 transform scale-105"
                  : "bg-gradient-to-br from-black/90 via-purple-900/80 to-black/90 backdrop-blur-lg border-purple-500/60 shadow-xl"
              }`}
            style={{
              transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
              boxShadow: djHovered
                ? "0 0 40px 12px rgba(34,211,238,0.4), 0 0 80px 20px rgba(168,85,247,0.2), 0 4px 20px rgba(0,0,0,0.3)"
                : "0 0 20px 5px rgba(168,85,247,0.3), 0 4px 15px rgba(0,0,0,0.4)",
            }}
          >
            <div className="text-center flex flex-col items-center">
              {/* Large animated microphone icon */}
              <div
                className={`text-6xl mb-4 transition-all duration-300 ${
                  djHovered ? "text-cyan-600 animate-pulse" : "text-purple-300 animate-bounce"
                }`}
                style={{
                  filter: djHovered ? "drop-shadow(0 0 20px rgba(34,211,238,0.6))" : "drop-shadow(0 0 15px rgba(168,85,247,0.5))",
                  transform: djHovered ? "scale(1.1)" : "scale(1)",
                }}
              >
                🎤
              </div>
              
              {/* DJ Voice-Over title with gradient */}
              <div
                className={`text-2xl font-bold mb-3 transition-all duration-300 ${
                  djHovered 
                    ? "bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent" 
                    : "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                }`}
                style={{
                  filter: djHovered ? "drop-shadow(0 2px 8px rgba(34,211,238,0.3))" : "drop-shadow(0 2px 8px rgba(168,85,247,0.4))",
                }}
              >
                DJ Voice-Over
              </div>

              {/* Status message with animated background */}
              <div className={`relative px-6 py-3 rounded-full transition-all duration-300 ${
                djHovered 
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20" 
                  : "bg-gradient-to-r from-purple-500/30 to-pink-500/30"
              }`}>
                <div
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    djHovered ? "text-cyan-700" : "text-cyan-300"
                  }`}
                >
                  {checkingSub ? (
                    <span className="flex items-center space-x-2">
                      <span className="animate-spin">⏳</span>
                      <span>Checking access...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2 animate-pulse">
                      <span>🚪</span>
                      <span>Click here to enter!</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Animated border effect */}
              <div className={`absolute inset-0 rounded-3xl border-2 transition-all duration-300 ${
                djHovered 
                  ? "border-cyan-300/50 animate-pulse" 
                  : "border-purple-400/30"
              }`} style={{ pointerEvents: 'none' }} />
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

      {/* Sign Out Button */}
      {isAuthenticated && (
        <div className="absolute top-6 right-6">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center space-x-3 border-2 ${
              isSigningOut 
                ? "bg-gray-500 border-gray-400 cursor-not-allowed opacity-75" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-purple-400 hover:border-purple-300 cursor-pointer transform hover:scale-105 active:scale-95"
            }`}
          >
            <span className="text-lg">{isSigningOut ? "⏳" : "🚪"}</span>
            <span className="text-white font-medium">{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
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
                  // Play DJ voice-over when welcome message shows after payment (only once)
                  playDJVoiceOverOnce();
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
