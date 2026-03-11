'use client';

import React, { useState, useEffect } from 'react';

interface GoogleDrivePickerProps {
  onVideoSelect: (blobUrl: string | null, index: 1 | 2) => void;
  selectedDayFolderId: string | null;
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onVideoSelect, selectedDayFolderId }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track selection by file ID
  const [selectedVideo1, setSelectedVideo1] = useState<string | null>(null);
  const [selectedVideo2, setSelectedVideo2] = useState<string | null>(null);
  
  // Track loading state for individual videos during download
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDayFolderId) {
      const fetchVideos = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/gdrive/videos?folderId=${selectedDayFolderId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch videos from server.');
          }
          const data = await response.json();
          setVideos(data.files || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchVideos();
      // Reset selections when folder changes
      setSelectedVideo1(null);
      setSelectedVideo2(null);
      setWarningMsg(null);
      onVideoSelect(null, 1);
      onVideoSelect(null, 2);
    }
  }, [selectedDayFolderId, onVideoSelect]);

  const fetchAndPassVideo = async (fileId: string, index: 1 | 2) => {
    setLoadingFileId(fileId);
    setError(null);
    setWarningMsg(null);
    try {
      const response = await fetch(`/api/gdrive/download?fileId=${fileId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to download video.`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      onVideoSelect(blobUrl, index);
    } catch (err: any) {
      setError(err.message);
      if (index === 1) setSelectedVideo1(null);
      if (index === 2) setSelectedVideo2(null);
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleVideoClick = (fileId: string) => {
    // If it's already loading, ignore clicks
    if (loadingFileId) return;
    
    setWarningMsg(null);

    // Deselect logic
    if (selectedVideo1 === fileId) {
      setSelectedVideo1(null);
      onVideoSelect(null, 1);
      return;
    }
    if (selectedVideo2 === fileId) {
      setSelectedVideo2(null);
      onVideoSelect(null, 2);
      return;
    }

    // Select logic
    if (!selectedVideo1) {
      setSelectedVideo1(fileId);
      fetchAndPassVideo(fileId, 1);
    } else if (!selectedVideo2) {
      setSelectedVideo2(fileId);
      fetchAndPassVideo(fileId, 2);
    } else {
      // Both slots full
      setWarningMsg("Both video slots are full. Deselect a video first by clicking on it again.");
      setTimeout(() => setWarningMsg(null), 3000);
    }
  };

  if (!selectedDayFolderId) {
    return (
        <div className="mt-4 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-white">Select a Day on the Calendar</h3>
            <p className="text-gray-400">Videos will appear here.</p>
        </div>
    );
  }

  return (
    <div className="mt-4 p-4 border border-gray-700 rounded-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Available Videos</h3>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Skier 1
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Skier 2
                </div>
            </div>
        </div>

        {error && <p className="text-red-500 my-2">{error}</p>}
        {warningMsg && <p className="text-orange-400 bg-orange-400/10 p-2 rounded border border-orange-400/50 my-2 text-sm">{warningMsg}</p>}
        {isLoading && <p className="text-gray-400 mb-4">Loading video list...</p>}
        
        {!isLoading && videos.length === 0 && (
            <p className="text-gray-400">No videos found for this day.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto p-2">
        {videos.map((video) => {
            const isSelected1 = selectedVideo1 === video.id;
            const isSelected2 = selectedVideo2 === video.id;
            const isSelected = isSelected1 || isSelected2;
            const isLoadingThis = loadingFileId === video.id;

            let borderClass = 'border-gray-600 hover:border-gray-400';
            if (isSelected1) borderClass = 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
            if (isSelected2) borderClass = 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';

            return (
                <div 
                    key={video.id} 
                    onClick={() => handleVideoClick(video.id)} 
                    className={`relative cursor-pointer border-2 rounded-lg bg-gray-800 flex flex-col items-center justify-center p-2 transition-all ${borderClass} ${loadingFileId && !isLoadingThis ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {/* Thumbnail placeholder if no thumbnailLink, else show thumbnail */}
                    <div className="w-full aspect-video bg-gray-900 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {video.thumbnailLink ? (
                            <img src={video.thumbnailLink} alt={video.name} className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-gray-500">No Thumb</span>
                        )}
                    </div>
                    <span className="text-xs text-center break-all w-full truncate text-white" title={video.name}>
                        {video.name}
                    </span>

                    {/* Status Overlays */}
                    {isLoadingThis && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                             <span className="text-xs font-bold text-white">Loading</span>
                        </div>
                    )}
                    {isSelected1 && !isLoadingThis && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Skier 1
                        </div>
                    )}
                    {isSelected2 && !isLoadingThis && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Skier 2
                        </div>
                    )}
                </div>
            );
        })}
        </div>
    </div>
  );
};

export default GoogleDrivePicker;
