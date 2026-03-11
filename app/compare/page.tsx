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

  // Timeline offsets (as percentage 0-75)
  const [offset1, setOffset1] = useState(10);
  const [offset2, setOffset2] = useState(10);

  // Sync points (in seconds)
  const [syncPoint1, setSyncPoint1] = useState<number | null>(null);
  const [syncPoint2, setSyncPoint2] = useState<number | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedDayFolderId, setSelectedDayFolderId] = useState<string | null>(null);
  const rootFolderId = "1VwYiffrhaG29uaCbb23eSJ9hV7gMzxvV";

  const handleDaySelect = (folderId: string, token: string) => {
    setSelectedDayFolderId(folderId);
    setAccessToken(token);
  };

  const handleVideoSelect = (blobUrl: string) => {
    if (!videoSrc1) {
      setVideoSrc1(blobUrl);
    } else {
      setVideoSrc2(blobUrl);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, videoNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (videoNumber === 1) {
        setVideoSrc1(url);
      } else {
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

  // Seek video when offset changes and video is paused
  useEffect(() => {
    if (!isPlaying && video1Ref.current && duration1) {
      video1Ref.current.currentTime = duration1 * (offset1 / 100);
    }
  }, [offset1, duration1, isPlaying]);

  useEffect(() => {
    if (!isPlaying && video2Ref.current && duration2) {
      video2Ref.current.currentTime = duration2 * (offset2 / 100);
    }
  }, [offset2, duration2, isPlaying]);

  const handleMarkSync = (videoNumber: 1 | 2) => {
    let newSyncPoint1 = syncPoint1;
    let newSyncPoint2 = syncPoint2;

    if (videoNumber === 1 && video1Ref.current) {
      const newPoint = video1Ref.current.currentTime;
      setSyncPoint1(newPoint);
      newSyncPoint1 = newPoint;
    } else if (videoNumber === 2 && video2Ref.current) {
      const newPoint = video2Ref.current.currentTime;
      setSyncPoint2(newPoint);
      newSyncPoint2 = newPoint;
    }

    if (newSyncPoint1 !== null && newSyncPoint2 !== null && duration1 > 0 && duration2 > 0) {
      const timeDifference = newSyncPoint1 - newSyncPoint2;
      const newOffsetInSeconds = (duration1 * (offset1 / 100)) - timeDifference;
      let newOffsetPercentage = (newOffsetInSeconds / duration2) * 100;
      
      if (newOffsetPercentage < 0) newOffsetPercentage = 0;
      if (newOffsetPercentage > 75) newOffsetPercentage = 75;
      setOffset2(newOffsetPercentage);
    }
  };
  
  const syncTime = useCallback(() => {
    if (!isPlaying || !video1Ref.current || !video2Ref.current || !duration1 || !duration2) {
        return;
    };

    // Use Video 1 as the Master
    const v1Time = video1Ref.current.currentTime;
    const v1StartOffset = duration1 * (offset1 / 100);
    const v2StartOffset = duration2 * (offset2 / 100);
    
    // Relative time in the playback (seconds since their respective start offsets)
    const relativeTime = v1Time - v1StartOffset;
    const v2TargetTime = v2StartOffset + relativeTime;

    // Only sync if they drift by more than 0.05s
    if (Math.abs(video2Ref.current.currentTime - v2TargetTime) > 0.05) {
        video2Ref.current.currentTime = v2TargetTime;
    }
    
    if (video1Ref.current.ended || video2Ref.current.ended) {
        setIsPlaying(false);
        return;
    }

    animationFrameId.current = requestAnimationFrame(syncTime);
  }, [isPlaying, offset1, offset2, duration1, duration2]);

  const handleReset = () => {
    setIsPlaying(false);
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

    if (video1Ref.current) {
      video1Ref.current.pause();
      video1Ref.current.currentTime = duration1 * (offset1 / 100);
    }
    if (video2Ref.current) {
      video2Ref.current.pause();
      video2Ref.current.currentTime = duration2 * (offset2 / 100);
    }
  };

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

  const stepFrame = (direction: 1 | -1) => {
    if (isPlaying || !video1Ref.current || !video2Ref.current) return;
    
    const frameTime = 1 / 30; // Assuming 30fps
    video1Ref.current.currentTime += direction * frameTime;
    video2Ref.current.currentTime += direction * frameTime;
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
      
      <GoogleDrivePicker onVideoSelect={handleVideoSelect} accessToken={accessToken} selectedDayFolderId={selectedDayFolderId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <label htmlFor="video1" className="block mb-2 text-sm font-medium text-gray-300">Import Video 1</label>
          <input type="file" id="video1" accept="video/*" onChange={(e) => handleFileChange(e, 1)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mb-4"/>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <label htmlFor="video2" className="block mb-2 text-sm font-medium text-gray-300">Import Video 2</label>
          <input type="file" id="video2" accept="video/*" onChange={(e) => handleFileChange(e, 2)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mb-4"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
              {videoSrc1 ? (
              <video ref={video1Ref} src={videoSrc1} onLoadedMetadata={() => handleLoadedMetadata(1)} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 1</p>
              )}
          </div>
          <button onClick={() => handleMarkSync(1)} disabled={!videoSrc1} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
              Mark Sync Point 1
          </button>
          <p className="text-center text-sm text-gray-400">Sync Point: {syncPoint1?.toFixed(2) ?? 'Not set'}</p>
        </div>
        <div className="space-y-2">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
              {videoSrc2 ? (
              <video ref={video2Ref} src={videoSrc2} onLoadedMetadata={() => handleLoadedMetadata(2)} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 2</p>
              )}
          </div>
           <button onClick={() => handleMarkSync(2)} disabled={!videoSrc2} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
              Mark Sync Point 2
          </button>
          <p className="text-center text-sm text-gray-400">Sync Point: {syncPoint2?.toFixed(2) ?? 'Not set'}</p>
        </div>
      </div>
      
      <div className="w-full max-w-4xl mx-auto my-8 flex flex-col items-center gap-4">
          <div className="flex justify-center gap-4">
            {!isPlaying && (
              <button onClick={() => stepFrame(-1)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors">
                &larr; Prev Frame
              </button>
            )}
            
            <button onClick={handlePlayPause} className={`${isPlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors w-32`}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>

            {!isPlaying && (
              <button onClick={() => stepFrame(1)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors">
                Next Frame &rarr;
              </button>
            )}
          </div>
          
          <button onClick={handleReset} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors w-32">
              Reset
          </button>
      </div>

      <TimelineSync 
          video1Name={`Video 1 (${(duration1 * (offset1/100)).toFixed(1)}s)`}
          video2Name={`Video 2 (${(duration2 * (offset2/100)).toFixed(1)}s)`}
          position1={offset1}
          position2={offset2}
          onDrag1={setOffset1}
          onDrag2={setOffset2}
      />
      
      <div className="text-center mt-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
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
