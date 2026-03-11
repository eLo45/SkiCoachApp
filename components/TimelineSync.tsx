'use client';

import React, { useRef, useCallback, useEffect } from 'react';

interface DraggableVideoProps {
  videoName: string;
  position: number; // current time in seconds
  duration: number; // total duration in seconds
  markers: number[]; // timestamps of sync points
  onSeek: (newTime: number) => void;
  color: string;
}

const DraggableVideo: React.FC<DraggableVideoProps> = ({ videoName, position, duration, markers, onSeek, color }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    updatePosition(event);
    
    const onMouseMove = (e: MouseEvent | TouchEvent) => updatePosition(e);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  const updatePosition = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current || duration === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
    
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    
    const newTime = (x / rect.width) * duration;
    onSeek(newTime);
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{videoName}</span>
        <span>{position.toFixed(2)}s / {duration.toFixed(2)}s</span>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-8 bg-gray-800 rounded-md relative cursor-pointer border border-gray-700 overflow-hidden"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Sync Point Markers */}
        {markers.map((m, i) => (
          <div 
            key={i}
            className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
            style={{ left: `${(m / duration) * 100}%` }}
            title={`Sync Point ${i + 1}`}
          />
        ))}

        {/* Progress Fill */}
        <div 
          className="absolute top-0 bottom-0 left-0 transition-all duration-100 ease-out opacity-30"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />

        {/* Draggable Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white z-20"
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface TimelineSyncProps {
    video1Name: string;
    video2Name: string;
    pos1: number;
    pos2: number;
    dur1: number;
    dur2: number;
    markers1: number[];
    markers2: number[];
    onSeek1: (time: number) => void;
    onSeek2: (time: number) => void;
}

const TimelineSync: React.FC<TimelineSyncProps> = ({
    video1Name, video2Name, pos1, pos2, dur1, dur2, markers1, markers2, onSeek1, onSeek2
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
            <DraggableVideo 
              videoName={video1Name} 
              position={pos1} 
              duration={dur1} 
              markers={markers1} 
              onSeek={onSeek1} 
              color="#4f46e5" 
            />
            <DraggableVideo 
              videoName={video2Name} 
              position={pos2} 
              duration={dur2} 
              markers={markers2} 
              onSeek={onSeek2} 
              color="#0891b2" 
            />
        </div>
    );
};

export default TimelineSync;
