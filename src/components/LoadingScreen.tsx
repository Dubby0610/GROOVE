import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  audioFile?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  audioFile
}) => {
  const [audioStarted, setAudioStarted] = useState(false);

  // AUTO-START DJ Barry audio when component mounts - MAKE IT PERSIST GLOBALLY
  useEffect(() => {
    if (audioFile && !audioStarted) {
      console.log('🎵 AUTO-STARTING DJ Barry audio:', audioFile);
      
      // Check if we already have a global DJ Barry audio playing
      if ((window as any).djBarryAudio && !(window as any).djBarryAudio.ended) {
        console.log('✅ DJ Barry audio already playing globally - reusing');
        setAudioStarted(true);
        return;
      }
      
      // Create GLOBAL audio object that persists after component unmounts
      const audio = new Audio(audioFile);
      audio.volume = 0.7;
      audio.loop = false; // Play once fully
      
      // Store globally so it doesn't stop when LoadingScreen unmounts
      (window as any).djBarryAudio = audio;
      
      // Add event listener to mark as finished when it ends
      audio.addEventListener('ended', () => {
        console.log('✅ DJ Barry audio finished playing completely');
        (window as any).djBarryAudio = null;
      });
      
      audio.play()
        .then(() => {
          console.log('✅ DJ Barry audio AUTO-PLAYING! Will continue after loading screen...');
          setAudioStarted(true);
        })
        .catch((error) => {
          console.log('⚠️ DJ Barry autoplay blocked, showing button:', error.message);
          // If autoplay fails, user can click button
        });
    }
  }, [audioFile, audioStarted]);

  // Manual audio starter - fallback if autoplay blocked
  const startDJBarryAudio = () => {
    if (audioFile && !audioStarted) {
      console.log('🎵 MANUAL START DJ Barry audio:', audioFile);
      
      const audio = new Audio(audioFile);
      audio.volume = 0.7;
      audio.loop = false;
      
      // Store globally
      (window as any).djBarryAudio = audio;
      
      // Add event listener to mark as finished when it ends
      audio.addEventListener('ended', () => {
        console.log('✅ DJ Barry audio finished playing completely');
        (window as any).djBarryAudio = null;
      });
      
      audio.play()
        .then(() => {
          console.log('✅ DJ Barry audio PLAYING! Will continue after loading screen...');
          setAudioStarted(true);
        })
        .catch((error) => {
          console.error('❌ DJ Barry audio failed:', error);
          alert('Audio failed to play: ' + error.message);
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-indigo-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-70" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/6 w-2 h-2 bg-violet-400 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/6 w-1 h-1 bg-fuchsia-400 rounded-full animate-pulse opacity-90" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Animated rings */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 border border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-pink-500/40 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-blue-500/50 rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>
        </div>
        </div>
        
      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Central pulsing orb */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-pulse shadow-2xl shadow-purple-500/50"></div>
          <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse opacity-60"></div>
        </div>
        
        {/* Audio button if needed */}
        {audioFile && !audioStarted && (
          <div className="mb-6">
            <button
              onClick={startDJBarryAudio}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-full shadow-2xl hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/50"
            >
              🎵 Start Audio
            </button>
          </div>
        )}
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* Ambient light effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-pink-500/10 via-transparent to-purple-500/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
};