import React from 'react';
import { Scene } from '../types';

interface NavigationIndicatorProps {
  currentScene: Scene;
}

export const NavigationIndicator: React.FC<NavigationIndicatorProps> = ({ currentScene }) => {
  const scenes = [
    { key: 'alley', label: 'Alley', icon: '🏢' },
    { key: 'elevator', label: 'Elevator', icon: '🛗' },
    { key: 'club-door', label: 'Club', icon: '🎵' }
  ];

  return (
    <div className="fixed top-6 right-6 z-40">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
        <div className="flex space-x-3">
          {scenes.map((scene, index) => (
            <div
              key={scene.key}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-300 ${
                currentScene === scene.key
                  ? 'bg-purple-500/50 text-white'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{scene.icon}</span>
              <span className="text-sm font-medium hidden sm:block">{scene.label}</span>
              {index < scenes.length - 1 && currentScene !== 'alley' && (
                <div className={`w-2 h-2 rounded-full ml-2 ${
                  scenes.findIndex(s => s.key === currentScene) > index
                    ? 'bg-green-400'
                    : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};