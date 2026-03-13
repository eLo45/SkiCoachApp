'use client';

import React, { useRef, useCallback, useEffect } from 'react';

interface DraggableVideoProps {
  videoName: string;
  position: number; // current time in seconds
  duration: number; // total duration in seconds
  markers: number[]; // timestamps of sync points
  onSeek: (newTime: number) => void;
  onScrubStart: () => void;
  color: string;
}

const DraggableVideo: React.FC<DraggableVideoProps> = ({ videoName, position, duration, markers, onSeek, onScrubStart, color }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    onScrubStart(); // Stop playback immediately
    updatePosition(event);

    const onMouseMove = (e: MouseEvent | TouchEvent) => updatePosition(e);    const onMouseUp = () => {
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
    <div className="w-full mb-8 mt-4">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span className="font-bold tracking-wider uppercase">{videoName}</span>
        <span className="font-mono">{position.toFixed(2)}s / {duration.toFixed(2)}s</span>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-6 bg-gray-800 rounded-full relative cursor-pointer border border-gray-700 hover:border-gray-500 transition-colors"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Sync Point Markers */}
        {markers.map((m, i) => (
          <div 
            key={i}
            className="absolute top-0 bottom-0 w-2 bg-yellow-400 z-10 shadow-[0_0_12px_rgba(250,204,21,1)]"
            style={{ left: `calc(${(m / duration) * 100}% - 4px)` }}
            title={`Sync Point ${i + 1}`}
          >
             {/* Small triangle at the top to make it pop out more */}
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-yellow-400"></div>
             {/* Number indicator */}
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-yellow-400">{i + 1}</div>
          </div>
        ))}

        {/* Progress Fill (Removed CSS transition to fix dragging lag) */}
        <div 
          className="absolute top-0 bottom-0 left-0 opacity-40 rounded-l-full"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />

        {/* Draggable Handle (Button) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full z-20 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing border-2"
          style={{ left: `calc(${progress}% - 12px)`, borderColor: color }}
        >
            {/* Time popover attached to handle */}
            <div className="absolute -top-7 bg-gray-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-md border border-gray-700 whitespace-nowrap">
                {position.toFixed(1)}s
            </div>
        </div>
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
    onScrubStart: () => void;
}

const TimelineSync: React.FC<TimelineSyncProps> = ({
    video1Name, video2Name, pos1, pos2, dur1, dur2, markers1, markers2, onSeek1, onSeek2, onScrubStart
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
            <DraggableVideo
              videoName={video1Name}
              position={pos1}
              duration={dur1}
              markers={markers1}
              onSeek={onSeek1}
              onScrubStart={onScrubStart}
              color="#4f46e5"
            />
            <DraggableVideo
              videoName={video2Name}
              position={pos2}
              duration={dur2}
              markers={markers2}
              onSeek={onSeek2}
              onScrubStart={onScrubStart}
              color="#0891b2"
            />
        </div>
    );
};
export default TimelineSync;
