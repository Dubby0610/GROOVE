import React, { useState } from 'react';

interface InteractiveHotspotProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
  hoverText: string;
  className?: string;
}

export const InteractiveHotspot: React.FC<InteractiveHotspotProps> = ({
  x,
  y,
  width,
  height,
  onClick,
  hoverText,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible clickable area */}
      <div className="w-full h-full" />
      
      {/* Hover indicator */}
      <div className={`absolute inset-0 border-2 border-cyan-400 rounded-lg transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-cyan-400/20 rounded-lg animate-pulse" />
      </div>
      
      {/* Hover text */}
      {isHovered && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
          {hoverText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
        </div>
      )}
    </div>
  );
};