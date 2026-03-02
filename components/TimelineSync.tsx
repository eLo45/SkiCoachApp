'use client';

import React, { useState, useRef, useCallback, MouseEvent, useEffect } from 'react';

interface DraggableVideoProps {
  videoName: string;
}

const DraggableVideo: React.FC<DraggableVideoProps> = ({ videoName }) => {
  const [position, setPosition] = useState(10); // Initial position in percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartOffset = useRef(0);

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
        isDragging.current = true;
        dragStartOffset.current = event.clientX - videoRef.current.getBoundingClientRect().left;
        document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
    if (isDragging.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const videoWidth = videoRef.current?.offsetWidth || 0;
      
      let newLeft = event.clientX - containerRect.left - dragStartOffset.current;

      if (newLeft < 0) newLeft = 0;
      if (newLeft > containerRect.width - videoWidth) {
        newLeft = containerRect.width - videoWidth;
      }
      
      const newPosition = (newLeft / containerRect.width) * 100;
      setPosition(newPosition);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="w-full h-16 bg-gray-800 rounded-lg relative my-4 border border-gray-700">
      <div
        ref={videoRef}
        className="absolute h-full w-1/4 bg-blue-600 rounded-lg cursor-grab flex items-center justify-center"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
      >
        <span className="text-white text-sm font-semibold select-none">{videoName}</span>
      </div>
    </div>
  );
};


const TimelineSync = () => {
    return (
        <div className="w-full max-w-4xl mx-auto mt-12">
            <p className="text-center text-sm text-gray-400 mb-4">
                Drag videos to adjust start times
            </p>
            <DraggableVideo videoName="Video 1" />
            <DraggableVideo videoName="Video 2" />
        </div>
    );
};

export default TimelineSync;
