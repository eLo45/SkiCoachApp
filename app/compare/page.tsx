'use client';

import React, { useState, useRef, ChangeEvent, useEffect, useCallback } from 'react';
import TimelineSync from '@/components/TimelineSync';
import Link from 'next/link';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';
import CalendarView from '@/components/CalendarView';

function ComparePageContent() {
  // Video sources
  const [videoSrc1, setVideoSrc1] = useState<string | null>(null);
  const [videoSrc2, setVideoSrc2] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameId = useRef<number>();

  // Video refs
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  
  // Video metadata
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [currentTime1, setCurrentTime1] = useState(0);
  const [currentTime2, setCurrentTime2] = useState(0);

  // NEW: Multi-Sync point state (max 2 points)
  const [syncsV1, setSyncsV1] = useState<number[]>([]);
  const [syncsV2, setSyncsV2] = useState<number[]>([]);

  const [selectedDayFolderId, setSelectedDayFolderId] = useState<string | null>(null);
  const rootFolderId = "1VwYiffrhaG29uaCbb23eSJ9hV7gMzxvV";

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoSrc1 && videoSrc1.startsWith('blob:')) URL.revokeObjectURL(videoSrc1);
      if (videoSrc2 && videoSrc2.startsWith('blob:')) URL.revokeObjectURL(videoSrc2);
    };
  }, [videoSrc1, videoSrc2]);

  const handleDaySelect = (folderId: string) => {
    setSelectedDayFolderId(folderId);
  };

  const handleVideoSelect = (blobUrl: string | null, index: 1 | 2) => {
    if (index === 1) {
      if (videoSrc1 && videoSrc1.startsWith('blob:')) URL.revokeObjectURL(videoSrc1);
      setVideoSrc1(blobUrl);
    } else {
      if (videoSrc2 && videoSrc2.startsWith('blob:')) URL.revokeObjectURL(videoSrc2);
      setVideoSrc2(blobUrl);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, videoNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (videoNumber === 1) {
        if (videoSrc1 && videoSrc1.startsWith('blob:')) URL.revokeObjectURL(videoSrc1);
        setVideoSrc1(url);
      } else {
        if (videoSrc2 && videoSrc2.startsWith('blob:')) URL.revokeObjectURL(videoSrc2);
        setVideoSrc2(url);
      }
    }
  };

  const handleLoadedMetadata = (videoNumber: 1 | 2) => {
    if (videoNumber === 1 && video1Ref.current) {
      setDuration1(video1Ref.current.duration);
    } else if (videoNumber === 2 && video2Ref.current) {
      setDuration2(video2Ref.current.duration);
    }
  };

  // Sync Logic: Dual-Offset Piecewise Synchronization
  const syncTime = useCallback(() => {
    if (!isPlaying || !video1Ref.current || !video2Ref.current) return;

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    
    setCurrentTime1(v1.currentTime);
    setCurrentTime2(v2.currentTime);

    // Determine which sync offset to use
    let activeOffsetIndex = -1;
    
    // Check if both sync points are set and if we've passed the second one
    if (syncsV1.length >= 2 && syncsV2.length >= 2 && v1.currentTime >= syncsV1[1]) {
      activeOffsetIndex = 1;
    } else if (syncsV1.length >= 1 && syncsV2.length >= 1) {
      activeOffsetIndex = 0;
    }

    if (activeOffsetIndex !== -1) {
      const s1 = syncsV1[activeOffsetIndex];
      const s2 = syncsV2[activeOffsetIndex];
      
      const relativeToSync = v1.currentTime - s1;
      const v2TargetTime = s2 + relativeToSync;

      // Sync if drift > 0.05s
      if (Math.abs(video2Ref.current.currentTime - v2TargetTime) > 0.05) {
        video2Ref.current.currentTime = v2TargetTime;
      }
    }
    
    if (v1.ended || v2.ended) {
        setIsPlaying(false);
        return;
    }

    animationFrameId.current = requestAnimationFrame(syncTime);
  }, [isPlaying, syncsV1, syncsV2]);

  const handlePlayPause = () => {
    if (!video1Ref.current || !video2Ref.current) return;

    if (isPlaying) {
      setIsPlaying(false);
      video1Ref.current.pause();
      video2Ref.current.pause();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    } else {
      setIsPlaying(true);
      video1Ref.current.play();
      video2Ref.current.play();
      animationFrameId.current = requestAnimationFrame(syncTime);
    }
  };

  const handleMarkSync = (videoNumber: 1 | 2) => {
    const vid = videoNumber === 1 ? video1Ref.current : video2Ref.current;
    if (!vid) return;

    if (videoNumber === 1) {
      if (syncsV1.length < 2) setSyncsV1([...syncsV1, vid.currentTime]);
    } else {
      if (syncsV2.length < 2) setSyncsV2([...syncsV2, vid.currentTime]);
    }
  };

  const jumpToSync = (index: number) => {
    if (syncsV1[index] === undefined || syncsV2[index] === undefined) return;
    
    setIsPlaying(false);
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

    if (video1Ref.current) {
      video1Ref.current.pause();
      video1Ref.current.currentTime = syncsV1[index];
      setCurrentTime1(syncsV1[index]);
    }
    if (video2Ref.current) {
      video2Ref.current.pause();
      video2Ref.current.currentTime = syncsV2[index];
      setCurrentTime2(syncsV2[index]);
    }
  };

  const clearSyncs = () => {
    setSyncsV1([]);
    setSyncsV2([]);
  };

  const stepFrames = (frames: number) => {
    if (isPlaying || !video1Ref.current || !video2Ref.current) return;
    const frameTime = (1 / 30) * frames;
    video1Ref.current.currentTime += frameTime;
    video2Ref.current.currentTime += frameTime;
    setCurrentTime1(video1Ref.current.currentTime);
    setCurrentTime2(video2Ref.current.currentTime);
  };

  const handleManualSeek1 = (time: number) => {
    if (!video1Ref.current) return;
    video1Ref.current.currentTime = time;
    setCurrentTime1(time);
  };

  const handleManualSeek2 = (time: number) => {
    if (!video2Ref.current) return;
    video2Ref.current.currentTime = time;
    setCurrentTime2(time);
  };

  return (
    <div className="w-full max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-center w-full">
          Athlete Video Comparison
        </h1>
      </div>

      <div className="my-4 p-4 border border-gray-700 rounded-lg">
        <CalendarView onDaySelect={handleDaySelect} rootFolderId={rootFolderId} />
      </div>
      
      <GoogleDrivePicker onVideoSelect={handleVideoSelect} selectedDayFolderId={selectedDayFolderId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <label className="block mb-2 text-sm font-medium text-gray-300">Import Video 1</label>
          <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 1)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mb-4"/>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <label className="block mb-2 text-sm font-medium text-gray-300">Import Video 2</label>
          <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 2)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mb-4"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden">
              {videoSrc1 ? (
              <video ref={video1Ref} src={videoSrc1} onLoadedMetadata={() => handleLoadedMetadata(1)} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 1</p>
              )}
          </div>
          <button 
            onClick={() => handleMarkSync(1)} 
            disabled={!videoSrc1 || syncsV1.length >= 2} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
          >
              {syncsV1.length === 0 ? "Mark Sync Point 1" : syncsV1.length === 1 ? "Mark Sync Point 2" : "Sync Points Full"}
          </button>
          <div className="flex justify-between text-xs text-gray-400 px-2">
            <span>Sync 1: {syncsV1[0]?.toFixed(2) || "---"}</span>
            <span>Sync 2: {syncsV1[1]?.toFixed(2) || "---"}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden">
              {videoSrc2 ? (
              <video ref={video2Ref} src={videoSrc2} onLoadedMetadata={() => handleLoadedMetadata(2)} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 2</p>
              )}
          </div>
           <button 
            onClick={() => handleMarkSync(2)} 
            disabled={!videoSrc2 || syncsV2.length >= 2} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
          >
              {syncsV2.length === 0 ? "Mark Sync Point 1" : syncsV2.length === 1 ? "Mark Sync Point 2" : "Sync Points Full"}
          </button>
          <div className="flex justify-between text-xs text-gray-400 px-2">
            <span>Sync 1: {syncsV2[0]?.toFixed(2) || "---"}</span>
            <span>Sync 2: {syncsV2[1]?.toFixed(2) || "---"}</span>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-4xl mx-auto my-8 flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
            {!isPlaying && (
              <>
                <button onClick={() => stepFrames(-4)} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2 px-3 rounded-lg border border-gray-600 transition-colors">
                  &laquo; -4
                </button>
                <button onClick={() => stepFrames(-2)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors">
                  &larr; -2
                </button>
              </>
            )}
            
            <button onClick={handlePlayPause} className={`${isPlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-2 px-10 rounded-lg text-xl transition-all w-44 shadow-lg`}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>

            {!isPlaying && (
              <>
                <button onClick={() => stepFrames(2)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors">
                  +2 &rarr;
                </button>
                <button onClick={() => stepFrames(4)} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2 px-3 rounded-lg border border-gray-600 transition-colors">
                  +4 &raquo;
                </button>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => jumpToSync(0)} 
                disabled={syncsV1.length < 1 || syncsV2.length < 1}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-30 transition-all"
              >
                Jump to Sync 1
              </button>
              
              {syncsV1.length >= 2 && syncsV2.length >= 2 && (
                <button 
                  onClick={() => jumpToSync(1)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                  Jump to Sync 2
                </button>
              )}

              <button 
                onClick={clearSyncs} 
                className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 font-bold py-2 px-6 rounded-lg transition-all"
              >
                Clear All Syncs
              </button>
          </div>
      </div>

      <TimelineSync 
          video1Name="Video 1"
          video2Name="Video 2"
          pos1={currentTime1}
          pos2={currentTime2}
          dur1={duration1}
          dur2={duration2}
          markers1={syncsV1}
          markers2={syncsV2}
          onSeek1={handleManualSeek1}
          onSeek2={handleManualSeek2}
      />
      
      <div className="text-center mt-12 pb-12">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors">
              &larr; Back to Home
          </Link>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-black text-white">
      <ComparePageContent />
    </main>
  );
}
