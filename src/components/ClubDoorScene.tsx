import React, { useState, useEffect } from "react";
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
  const clubLabel = FLOOR_LABELS[idx];
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

  useEffect(() => {
    // Simulate music-driven lighting pulse
    const interval = setInterval(() => {
      setPulseIntensity(Math.random() * 0.5 + 0.3);
    }, 200);

    // Trigger DJ voice-over after a moment
    const voiceOverTimer = setTimeout(() => {
      playDJVoiceOver();
      setShowWelcomeMessage(true);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(voiceOverTimer);
    };
  }, [playDJVoiceOver, clubFloor]);

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
  }, [clubFloor]);

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
      window.location.href = "/";
      
    } catch (error) {
      console.error("Error during sign out:", error);
      setIsSigningOut(false);
      // Force logout even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  // Extract just the floor name (after the dash)
  const clubTitle = clubLabel.split("-").slice(1).join("-").trim();

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

      {/* DJ Voice-over message only if authenticated and not showing auth modal */}
      {((isAuthenticated && showWelcomeMessage && !authModalOpen) || (!showPaymentModal && !authModalOpen)) && (
        <div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-md mx-4 z-20"
          onMouseEnter={() => setDjHovered(true)}
          onMouseLeave={() => setDjHovered(false)}
          onClick={checkingSub ? undefined : handleDJClick}
          style={{ cursor: checkingSub ? "not-allowed" : "pointer" }}
        >
          <div
            className={`rounded-xl p-6 border-4 transition-all duration-200 animate-fade-in h-40
              ${
                djHovered
                  ? "bg-cyan-100/90 border-cyan-400 shadow-xl ring-4 ring-cyan-300/40"
                  : "bg-black/80 backdrop-blur-sm border-purple-500/50 shadow-lg"
              }`}
            style={{
              transition: "all 0.25s cubic-bezier(.4,2,.6,1)",
              boxShadow: djHovered
                ? "0 0 32px 8px rgba(34,211,238,0.3), 0 2px 8px rgba(0,0,0,0.2)"
                : "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <div className="text-center">
              <div
                className={`text-2xl mb-2 transition-colors duration-200 ${
                  djHovered ? "text-cyan-700" : "text-purple-200"
                }`}
              >
                🎤
              </div>
              <div
                className={`font-medium mb-2 transition-colors duration-200 ${
                  djHovered ? "text-cyan-700 font-bold" : "text-purple-400"
                }`}
              >
                DJ Voice-Over
              </div>
              <div
                className={`text-sm leading-relaxed transition-colors duration-200 ${
                  djHovered ? "text-gray-800" : "text-white"
                }`}
              >
                "Welcome to the hottest spot in the city! Get ready to
                experience the grooviest night of your life..."
              </div>
              {!djHovered && (
                <div className="mt-5 text-cyan-300 text-xs font-semibold animate-bounce">
                  {checkingSub ? "Checking access..." : "Click here to enter!"}
                </div>
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
