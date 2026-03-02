'use client';

import React, { useState, useRef, useCallback, MouseEvent, useEffect } from 'react';

const SyncSlider: React.FC = () => {
  const [position, setPosition] = useState(50); // Position as a percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleDrag = useCallback((event: globalThis.MouseEvent | React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = event.clientX - rect.left;
      let newPosition = (newX / rect.width) * 100;

      if (newPosition < 0) newPosition = 0;
      if (newPosition > 100) newPosition = 100;
      
      setPosition(newPosition);
    }
  }, []);

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleDrag(event); // Move on initial click
    document.body.style.cursor = 'ew-resize';
  };

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
    if (isDragging.current) {
      handleDrag(event);
    }
  }, [handleDrag]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <p className="text-center text-sm text-gray-400 mb-2">
        Adjust video synchronization point
      </p>
      <div
        ref={containerRef}
        className="relative w-full h-20 bg-gray-800 rounded-lg p-2 cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Upper track */}
        <div className="absolute top-[30%] left-4 right-4 h-2 bg-gray-600 rounded-full" />
        {/* Lower track */}
        <div className="absolute bottom-[30%] left-4 right-4 h-2 bg-gray-600 rounded-full" />

        {/* Draggable Vertical Line */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500"
          style={{ left: `${position}%` }}
        >
          {/* Top handle */}
          <div className="absolute -top-1.5 -left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
             <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          {/* Bottom handle */}
           <div className="absolute -bottom-1.5 -left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
             <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSlider;
