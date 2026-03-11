'use client';

import React, { useRef, MouseEvent, useState, useEffect, useCallback } from 'react';

interface DraggableVideoProps {
  videoName: string;
  position: number;
  onDrag: (newPosition: number) => void;
}

const DraggableVideo: React.FC<DraggableVideoProps> = ({ videoName, position, onDrag }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffsetRef = useRef(0);

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    event.preventDefault();
    setIsDragging(true);
    dragStartOffsetRef.current = event.clientX - videoRef.current.getBoundingClientRect().left;
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    }
  }, [isDragging]);

  const handleMouseMove = useCallback((moveEvent: globalThis.MouseEvent) => {
    if (!isDragging || !containerRef.current || !videoRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const videoWidth = videoRef.current.offsetWidth;
    const containerWidth = containerRect.width;
    
    // Calculate new position as percentage of container width
    let newLeft = moveEvent.clientX - containerRect.left - dragStartOffsetRef.current;
    
    // Bounds check
    const maxLeft = containerWidth - videoWidth;
    if (newLeft < 0) newLeft = 0;
    if (newLeft > maxLeft) newLeft = maxLeft;
    
    const newPosition = (newLeft / containerWidth) * 100;
    onDrag(newPosition);
  }, [isDragging, onDrag]); // Keep onDrag but ensure parent passes stable ref

  useEffect(() => {
    const mouseMoveListener = (e: globalThis.MouseEvent) => handleMouseMove(e);
    const mouseUpListener = () => handleMouseUp();

    if (isDragging) {
      window.addEventListener('mousemove', mouseMoveListener);
      window.addEventListener('mouseup', mouseUpListener);
    }

    return () => {
      window.removeEventListener('mousemove', mouseMoveListener);
      window.removeEventListener('mouseup', mouseUpListener);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

interface TimelineSyncProps {
    video1Name: string;
    video2Name: string;
    position1: number;
    position2: number;
    onDrag1: (newPosition: number) => void;
    onDrag2: (newPosition: number) => void;
}

const TimelineSync: React.FC<TimelineSyncProps> = ({
    video1Name,
    video2Name,
    position1,
    position2,
    onDrag1,
    onDrag2
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto mt-12">
            <p className="text-center text-sm text-gray-400 mb-4">
                Drag videos to adjust start times
            </p>
            <DraggableVideo videoName={video1Name} position={position1} onDrag={onDrag1} />
            <DraggableVideo videoName={video2Name} position={position2} onDrag={onDrag2} />
        </div>
    );
};

export default TimelineSync;
