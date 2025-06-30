import React, { useState, useEffect } from 'react';
import PaymentModal from "./PaymentModal";

const FLOOR_IMAGES = [
  "/imgs/1st.png",
  "/imgs/2nd.png",
  "/imgs/3rd.png",
  "/imgs/4th.png"
];

const FLOOR_LABELS = [
  "1st floor - Party Vibes",
  "2nd floor - Boogie Wonderland",
  "3rd floor - For The Sexy People",
  "4th floor - Late Night Agenda"
];

interface ClubDoorSceneProps {
  clubFloor: number | null;
  onEnterClub: () => void;
  playDJVoiceOver: () => void;
}

export const ClubDoorScene: React.FC<ClubDoorSceneProps> = ({ clubFloor, onEnterClub, playDJVoiceOver }) => {
  // Derive info from clubFloor
  const idx = clubFloor ? (clubFloor - 1) % FLOOR_IMAGES.length : 0;
  const clubImage = FLOOR_IMAGES[idx];
  const clubLabel = FLOOR_LABELS[idx];

  const [pulseIntensity, setPulseIntensity] = useState(0.5);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [djHovered, setDjHovered] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const handleEnterClub = () => {
    setShowWelcomeMessage(false);
    onEnterClub();
  };

  // Extract just the floor name (after the dash)
  const clubTitle = clubLabel.split('-').slice(1).join('-').trim();

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${clubImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >

      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: pulseIntensity }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Sound visualization bars */}
      <div className="absolute bottom-20 left-8 flex space-x-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-4 bg-gradient-to-t from-purple-500 to-pink-500 animate-pulse"
            style={{
              height: `${Math.random() * 40 + 10}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.3 + Math.random() * 0.3}s`
            }}
          />
        ))}
      </div>
      
      <div className="absolute bottom-20 right-8 flex space-x-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-4 bg-gradient-to-t from-cyan-500 to-blue-500 animate-pulse"
            style={{
              height: `${Math.random() * 30 + 15}px`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.4 + Math.random() * 0.4}s`
            }}
          />
        ))}
      </div>
      
      {/* DJ Voice-over message */}
      {showWelcomeMessage && (
        <div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-md mx-4 z-20"
          onMouseEnter={() => setDjHovered(true)}
          onMouseLeave={() => setDjHovered(false)}
          onClick={() => setShowPaymentModal(true)}
          style={{ cursor: 'pointer' }}
        >
          <div
            className={
              `rounded-xl p-6 border-4 transition-all duration-200 animate-fade-in h-40
              ${djHovered
                ? "bg-cyan-100/90 border-cyan-400 shadow-xl ring-4 ring-cyan-300/40"
                : "bg-black/80 backdrop-blur-sm border-purple-500/50 shadow-lg"
              }`
            }
            style={{
              transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
              boxShadow: djHovered
                ? '0 0 32px 8px rgba(34,211,238,0.3), 0 2px 8px rgba(0,0,0,0.2)'
                : '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <div className="text-center">
              <div className={`text-2xl mb-2 transition-colors duration-200 ${djHovered ? "text-cyan-700" : "text-purple-200"}`}>🎤</div>
              <div className={`font-medium mb-2 transition-colors duration-200 ${djHovered ? "text-cyan-700 font-bold" : "text-purple-400"}`}>DJ Voice-Over</div>
              <div className={`text-sm leading-relaxed transition-colors duration-200 ${djHovered ? "text-gray-800" : "text-white"}`}>
                "Welcome to the hottest spot in the city! Get ready to experience the grooviest night of your life..."
              </div>
              {!djHovered && (
                <div className="mt-5 text-cyan-300 text-xs font-semibold animate-bounce">
                  Click here to enter!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Guest count display */}
      <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-sm rounded-lg p-3">
        <div className="text-cyan-400 text-sm font-medium">Guests Tonight</div>
        <div className="text-white text-2xl font-bold">247</div>
      </div>

      <PaymentModal open={showPaymentModal} onOpenChange={setShowPaymentModal} />
    </div>
  );
};