import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
  audioFile?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Entering the scene...",
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
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        
        <div className="text-white text-xl font-light tracking-wide">
          {message}
        </div>
        
        {/* DJ Barry Audio Button */}
        {audioFile && !audioStarted && (
          <div className="mt-6">
            <button
              onClick={startDJBarryAudio}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              🎵 Click to Start Audio
            </button>
          </div>
        )}
        
        {audioStarted && (
          <div className="mt-6 text-green-400 font-semibold">
            🎵 DJ Barry Audio Playing!
          </div>
        )}
        
        <div className="mt-4 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};