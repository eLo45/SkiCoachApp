'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import TimelineSync from '@/components/TimelineSync';
import Link from 'next/link';

export default function ComparePage() {
  const [videoSrc1, setVideoSrc1] = useState<string | null>(null);
  const [videoSrc2, setVideoSrc2] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, setVideoSrc: (src: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const handlePlayPause = () => {
    if (video1Ref.current && video2Ref.current) {
      if (isPlaying) {
        video1Ref.current.pause();
        video2Ref.current.pause();
      } else {
        video1Ref.current.play();
        video2Ref.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-black text-white">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          Athlete Video Comparison
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label htmlFor="video1" className="block mb-2 text-sm font-medium text-gray-300">Import Video 1</label>
            <input type="file" id="video1" accept="video/*" onChange={(e) => handleFileChange(e, setVideoSrc1)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"/>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label htmlFor="video2" className="block mb-2 text-sm font-medium text-gray-300">Import Video 2</label>
            <input type="file" id="video2" accept="video/*" onChange={(e) => handleFileChange(e, setVideoSrc2)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            {videoSrc1 ? (
              <video ref={video1Ref} src={videoSrc1} className="w-full h-full" controls={false} />
            ) : (
              <p className="text-gray-500">Video Player 1</p>
            )}
          </div>
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            {videoSrc2 ? (
              <video ref={video2Ref} src={videoSrc2} className="w-full h-full" controls={false} />
            ) : (
              <p className="text-gray-500">Video Player 2</p>
            )}
          </div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto mt-4 text-center">
            <button onClick={handlePlayPause} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors">
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>

        <TimelineSync />
        
        <div className="text-center mt-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                &larr; Back to Home
            </Link>
        </div>
      </div>
    </main>
  );
}
