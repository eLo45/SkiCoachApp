'use client';

import React, { useState, useRef, ChangeEvent, useEffect, useCallback, Suspense } from 'react';
import TimelineSync from '@/components/TimelineSync';
import Link from 'next/link';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';
import CalendarView from '@/components/CalendarView';
import { useSearchParams } from 'next/navigation';

function SideBySidePageContent() {
  const searchParams = useSearchParams();
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

  const [stagedDriveVideo1, setStagedDriveVideo1] = useState<{name: string} | null>(null);
  const [stagedDriveVideo2, setStagedDriveVideo2] = useState<{name: string} | null>(null);

  const [isVideo1Loaded, setIsVideo1Loaded] = useState(false);
  const [isVideo2Loaded, setIsVideo2Loaded] = useState(false);
  
  const [isStaging1, setIsStaging1] = useState(false);
  const [isStaging2, setIsStaging2] = useState(false);

  const [isBuffering1, setIsBuffering1] = useState(false);
  const [isBuffering2, setIsBuffering2] = useState(false);

  const [selectedVideo1Id, setSelectedVideo1Id] = useState<string | null>(null);
  const [selectedVideo2Id, setSelectedVideo2Id] = useState<string | null>(null);
  
  const [loadError, setLoadError] = useState<string | null>(null);

  const abortController1Ref = useRef<AbortController | null>(null);
  const abortController2Ref = useRef<AbortController | null>(null);

  const pendingInitialSeek1 = useRef<number | null>(null);
  const pendingInitialSeek2 = useRef<number | null>(null);

  // Cleanup blob URLs on unmount to prevent memory leaks (for local files)
  useEffect(() => {
    return () => {
      if (videoSrc1 && videoSrc1.startsWith('blob:')) URL.revokeObjectURL(videoSrc1);
      if (videoSrc2 && videoSrc2.startsWith('blob:')) URL.revokeObjectURL(videoSrc2);
    };
  }, [videoSrc1, videoSrc2]);

  // Cleanup abort controllers only on unmount
  useEffect(() => {
    return () => {
      if (abortController1Ref.current) abortController1Ref.current.abort();
      if (abortController2Ref.current) abortController2Ref.current.abort();
    };
  }, []);

  const handleDaySelect = (folderId: string) => {
    setSelectedDayFolderId(folderId);
    
    // Completely wipe players and purge any local memory blobs when changing days
    if (videoSrc1 && videoSrc1.startsWith('blob:')) URL.revokeObjectURL(videoSrc1);
    if (videoSrc2 && videoSrc2.startsWith('blob:')) URL.revokeObjectURL(videoSrc2);
    
    setVideoSrc1(null);
    setVideoSrc2(null);
    setSelectedVideo1Id(null);
    setSelectedVideo2Id(null);
    setStagedDriveVideo1(null);
    setStagedDriveVideo2(null);
    setIsVideo1Loaded(false);
    setIsVideo2Loaded(false);
    setIsBuffering1(false);
    setIsBuffering2(false);
    setLoadError(null);
    
    resetSlotState(1);
    resetSlotState(2);
  };

  const resetSlotState = useCallback((index: 1 | 2) => {
    if (index === 1) {
      setSyncsV1([]);
      setCurrentTime1(0);
      setDuration1(0);
      if (video1Ref.current) video1Ref.current.currentTime = 0;
    } else {
      setSyncsV2([]);
      setCurrentTime2(0);
      setDuration2(0);
      if (video2Ref.current) video2Ref.current.currentTime = 0;
    }
  }, []);

  const handleVideoSelect = useCallback(async (fileId: string | null, index: 1 | 2, fileName?: string) => {
    const setStaged = index === 1 ? setStagedDriveVideo1 : setStagedDriveVideo2;
    const setSrc = index === 1 ? setVideoSrc1 : setVideoSrc2;
    const currentSrc = index === 1 ? videoSrc1 : videoSrc2;
    const abortRef = index === 1 ? abortController1Ref : abortController2Ref;
    const setIsStaging = index === 1 ? setIsStaging1 : setIsStaging2;
    const setLoaded = index === 1 ? setIsVideo1Loaded : setIsVideo2Loaded;
    const setSelectedVideoId = index === 1 ? setSelectedVideo1Id : setSelectedVideo2Id;

    if (fileName) setStaged({ name: fileName });
    else setStaged(null);

    // Always clear the specific slot's playback/sync state when a new video is chosen or deselected
    resetSlotState(index);
    setSelectedVideoId(fileId);
    setLoadError(null);

    // Abort existing downloads for this slot
    if (abortRef.current) {
        abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    if (!fileId) {
      if (currentSrc && currentSrc.startsWith('blob:')) URL.revokeObjectURL(currentSrc);
      setSrc(null);
      setIsStaging(false);
      setLoaded(false);
      return;
    }
    
    setIsStaging(true);
    setLoaded(false);

    try {
      const response = await fetch(`/api/gdrive/download?fileId=${fileId}`, {
        signal: abortRef.current.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (currentSrc && currentSrc.startsWith('blob:')) URL.revokeObjectURL(currentSrc);
      
      const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);

      // On mobile, the OS blocks preloading. We set isBuffering to true so we can disable the scrubbers
      // until the user hits play and the OS allows the video to buffer.
      if (isMobile) {
        if (index === 1) setIsBuffering1(true);
        if (index === 2) setIsBuffering2(true);
      }

      setSrc(data.url + `#t=${index === 1 && pendingInitialSeek1.current !== null ? pendingInitialSeek1.current : (index === 2 && pendingInitialSeek2.current !== null ? pendingInitialSeek2.current : 0)}`);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
          console.error('Error fetching video URL:', err);
          setLoadError(`Failed to load video: ${err.message}`);
      }
    } finally {
      setIsStaging(false);
    }
    
  }, [videoSrc1, videoSrc2, resetSlotState]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [copyLinkText, setCopyLinkText] = useState("Share Link");
  const [sharedLinkParams, setSharedLinkParams] = useState<{v1: string|null, v2: string|null, s1: string|null, s2: string|null} | null>(null);

  // URL Initialization
  useEffect(() => {
    const v1 = searchParams.get('v1');
    const v2 = searchParams.get('v2');
    const s1 = searchParams.get('s1');
    const s2 = searchParams.get('s2');

    if (v1 || v2) {
        setIsDrawerOpen(false);
        setSharedLinkParams({v1, v2, s1, s2});
    }
  }, [searchParams]);

  const loadSharedAnalysis = () => {
    if (!sharedLinkParams) return;
    const {v1, v2, s1, s2} = sharedLinkParams;

    if (s1) {
      const parsed = s1.split(',').map(Number).filter(n => !isNaN(n));
      setSyncsV1(parsed);
      if (parsed.length > 0) pendingInitialSeek1.current = parsed[0];
    }
    if (s2) {
      const parsed = s2.split(',').map(Number).filter(n => !isNaN(n));
      setSyncsV2(parsed);
      if (parsed.length > 0) pendingInitialSeek2.current = parsed[0];
    }

    if (v1) handleVideoSelect(v1, 1, 'Shared Video 1');
    if (v2) handleVideoSelect(v2, 2, 'Shared Video 2');
    
    setSharedLinkParams(null); // Hide the prompt
  };

  // Robust Seek Loop
  useEffect(() => {
    const applyInitialSeek = (videoRef: React.RefObject<HTMLVideoElement>, pendingSeek: React.MutableRefObject<number | null>, setTime: (t: number) => void) => {
      if (videoRef.current && pendingSeek.current !== null && videoRef.current.readyState >= 1) {
        try {
          videoRef.current.currentTime = pendingSeek.current;
          setTime(pendingSeek.current);
          pendingSeek.current = null;
        } catch (e) {
          console.warn("Seek interrupted", e);
        }
      }
    };
    
    const interval = setInterval(() => {
      applyInitialSeek(video1Ref, pendingInitialSeek1, setCurrentTime1);
      applyInitialSeek(video2Ref, pendingInitialSeek2, setCurrentTime2);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleShareLink = () => {
    const params = new URLSearchParams();
    if (selectedVideo1Id) params.set('v1', selectedVideo1Id);
    if (selectedVideo2Id) params.set('v2', selectedVideo2Id);
    if (syncsV1.length > 0) params.set('s1', syncsV1.map(n => n.toFixed(2)).join(','));
    if (syncsV2.length > 0) params.set('s2', syncsV2.map(n => n.toFixed(2)).join(','));
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setCopyLinkText("Copied!");
    setTimeout(() => setCopyLinkText("Share Link"), 2000);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, videoNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      resetSlotState(videoNumber);
      if (videoNumber === 1) {
        setIsVideo1Loaded(false);
        setVideoSrc1(url);
        setStagedDriveVideo1({name: file.name}); 
        setSelectedVideo1Id(null);
      } else {
        setIsVideo2Loaded(false);
        setVideoSrc2(url);
        setStagedDriveVideo2({name: file.name});
        setSelectedVideo2Id(null);
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

  const handleCanPlayThrough = (videoNumber: 1 | 2) => {
    if (videoNumber === 1) setIsBuffering1(false);
    if (videoNumber === 2) setIsBuffering2(false);
  };

  // Sync Logic: Simple UI Update Loop (No Rubber-Banding)
  const syncTime = useCallback(() => {
    if (!video1Ref.current || !video2Ref.current) return;

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;

    // Check native paused state instead of React state to avoid closure staleness
    if (v1.paused && v2.paused) return;

    setCurrentTime1(v1.currentTime);
    setCurrentTime2(v2.currentTime);

    if (v1.ended || v2.ended) {
        setIsPlaying(false);
        return;
    }

    animationFrameId.current = requestAnimationFrame(syncTime);
  }, []);

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

  const handleScrubStart = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (video1Ref.current) video1Ref.current.pause();
    if (video2Ref.current) video2Ref.current.pause();
  }, []);

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
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
      {/* Mobile Landscape Prompt */}
      <div className="md:hidden w-full bg-blue-900/50 text-blue-200 text-xs text-center py-2 px-4 mb-4 rounded-lg flex items-center justify-center gap-2 border border-blue-800">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        Rotate phone to landscape for the best side-by-side experience
      </div>

      {loadError && (
        <div className="w-full bg-red-900/50 text-red-200 text-sm text-center py-4 px-4 mb-4 rounded-lg border border-red-800">
          {loadError}
        </div>
      )}

      {sharedLinkParams && (
        <div className="w-full bg-indigo-900/40 border border-indigo-500/50 p-6 rounded-xl flex flex-col items-center justify-center gap-4 mb-6 shadow-xl">
          <h2 className="text-xl font-bold text-indigo-100">Shared Analysis Ready</h2>
          <p className="text-indigo-300 text-sm text-center max-w-md">Click below to download the videos and apply the pre-selected sync points.</p>
          <button 
            onClick={loadSharedAnalysis}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Load Shared Videos
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 w-full">
        <h1 className="text-2xl md:text-4xl font-bold text-center w-full">
          Side-by-Side Analysis
        </h1>
      </div>

      {/* Drawer Toggle Button for Mobile */}
      <button 
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="md:hidden w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg border border-gray-600 mb-4 flex justify-between items-center transition-colors"
      >
        <span>Select Videos from Drive</span>
        <svg className={`w-5 h-5 transform transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {/* Collapsible Picker Section */}
      <div className={`${isDrawerOpen ? 'block' : 'hidden'} md:block w-full transition-all duration-300 ease-in-out`}>
        <div className="my-2 p-4 border border-gray-700 rounded-lg bg-gray-900/50">
          <CalendarView onDaySelect={handleDaySelect} rootFolderId={rootFolderId} />
        </div>
        
        <GoogleDrivePicker 
          onVideoSelect={(fileId, index, fileName) => {
            handleVideoSelect(fileId, index, fileName);
          }} 
          selectedDayFolderId={selectedDayFolderId} 
          selectedVideo1Id={selectedVideo1Id}
          selectedVideo2Id={selectedVideo2Id}
        />
        
        {/* Close button at the bottom of the drawer for mobile */}
        {isDrawerOpen && (
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="md:hidden w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-4 shadow-lg"
          >
            Done Selecting - Go to Players
          </button>
        )}
      </div>

      {/* Video Players Section (Sticky on Mobile if in Portrait) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mt-6 md:mt-8 sticky top-0 z-40 bg-black/90 backdrop-blur-sm pt-2 pb-4 md:static md:bg-transparent md:pt-0 md:pb-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
             <label className="text-sm font-medium text-blue-400">
               Skier 1 {stagedDriveVideo1 ? <span className="text-blue-200 font-bold">- {stagedDriveVideo1.name}</span> : ''}
             </label>
             <label className="text-xs text-gray-500 italic cursor-pointer hover:text-blue-300">
                Or choose local file...
                <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 1)} className="hidden" />
             </label>
          </div>
          
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative group">
              {/* Mobile Double Tap Zones */}
              <div 
                className="absolute inset-y-0 left-0 w-1/3 z-20 md:hidden" 
                onDoubleClick={() => stepFrames(-2)}
              ></div>
              <div 
                className="absolute inset-y-0 right-0 w-1/3 z-20 md:hidden" 
                onDoubleClick={() => stepFrames(2)}
              ></div>

              {isStaging1 && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-4 text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white font-bold mb-1">Loading Video...</span>
                  </div>
              )}
              {videoSrc1 ? (
              <video key={videoSrc1} ref={video1Ref} src={videoSrc1} preload="auto" onLoadedMetadata={() => handleLoadedMetadata(1)} onCanPlayThrough={() => handleCanPlayThrough(1)} onTimeUpdate={() => { if (video1Ref.current && !isPlaying) setCurrentTime1(video1Ref.current.currentTime); }} className="w-full h-full z-10" controls={false} muted playsInline/>
              ) : (
              <p className="text-gray-500">Video Player 1</p>
              )}
          </div>
          <button 
            onClick={() => handleMarkSync(1)} 
            disabled={!videoSrc1 || syncsV1.length >= 2} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 md:py-3 rounded-lg disabled:opacity-50 text-sm md:text-base transition-colors"
          >
              {syncsV1.length === 0 ? "Mark Sync Point 1" : syncsV1.length === 1 ? "Mark Sync Point 2" : "Sync Points Full"}
          </button>
          <div className="flex justify-between text-xs text-gray-400 px-2 pb-2 md:pb-0">
            <span>Sync 1: {syncsV1[0]?.toFixed(2) || "---"}</span>
            <span>Sync 2: {syncsV1[1]?.toFixed(2) || "---"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
             <label className="text-sm font-medium text-green-400">
               Skier 2 {stagedDriveVideo2 ? <span className="text-green-200 font-bold">- {stagedDriveVideo2.name}</span> : ''}
             </label>
             <label className="text-xs text-gray-500 italic cursor-pointer hover:text-green-300">
                Or choose local file...
                <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 2)} className="hidden" />
             </label>
          </div>

          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative group">
              {/* Mobile Double Tap Zones */}
              <div 
                className="absolute inset-y-0 left-0 w-1/3 z-20 md:hidden" 
                onDoubleClick={() => stepFrames(-2)}
              ></div>
              <div 
                className="absolute inset-y-0 right-0 w-1/3 z-20 md:hidden" 
                onDoubleClick={() => stepFrames(2)}
              ></div>

              {isStaging2 && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-4 text-center">
                      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white font-bold mb-1">Loading Video...</span>
                  </div>
              )}
              {videoSrc2 ? (
              <video key={videoSrc2} ref={video2Ref} src={videoSrc2} preload="auto" onLoadedMetadata={() => handleLoadedMetadata(2)} onCanPlayThrough={() => handleCanPlayThrough(2)} onTimeUpdate={() => { if (video2Ref.current && !isPlaying) setCurrentTime2(video2Ref.current.currentTime); }} className="w-full h-full z-10" controls={false} muted playsInline/>
              ) : (
              <p className="text-gray-500">Video Player 2</p>
              )}
          </div>
           <button 
            onClick={() => handleMarkSync(2)} 
            disabled={!videoSrc2 || syncsV2.length >= 2} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 md:py-3 rounded-lg disabled:opacity-50 text-sm md:text-base transition-colors"
          >
              {syncsV2.length === 0 ? "Mark Sync Point 1" : syncsV2.length === 1 ? "Mark Sync Point 2" : "Sync Points Full"}
          </button>
          <div className="flex justify-between text-xs text-gray-400 px-2 pb-2 md:pb-0">
            <span>Sync 1: {syncsV2[0]?.toFixed(2) || "---"}</span>
            <span>Sync 2: {syncsV2[1]?.toFixed(2) || "---"}</span>
          </div>
        </div>
      </div>
      
      <div className={`w-full max-w-4xl mx-auto my-8 flex flex-col items-center gap-6 transition-opacity duration-300 ${(isBuffering1 || isBuffering2) ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          
          {(isBuffering1 || isBuffering2) && (
              <div className="text-orange-400 text-sm font-bold bg-orange-400/10 px-4 py-2 rounded-lg border border-orange-400/30 text-center w-full max-w-md">
                Buffering video... Scrubbing is locked to prevent crashes. Please wait.
              </div>
          )}

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
          onScrubStart={handleScrubStart}
      />
      
      <div className="flex justify-center mt-6">
          <button 
            onClick={handleShareLink} 
            disabled={!selectedVideo1Id && !selectedVideo2Id}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-full shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            {copyLinkText}
          </button>
      </div>
      
      <div className="text-center mt-12 pb-12">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors">
              &larr; Back to Home
          </Link>
      </div>
    </div>
  );
}

export default function SideBySidePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-black text-white">
      <Suspense fallback={<div className="text-white text-xl">Loading...</div>}>
        <SideBySidePageContent />
      </Suspense>
    </main>
  );
}