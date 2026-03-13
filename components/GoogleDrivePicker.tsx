'use client';

import React, { useState, useEffect } from 'react';

interface GoogleDrivePickerProps {
  onVideoSelect: (fileId: string | null, index: 1 | 2, fileName?: string) => void;
  selectedDayFolderId: string | null;
  selectedVideo1Id: string | null;
  selectedVideo2Id: string | null;
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onVideoSelect, selectedDayFolderId, selectedVideo1Id, selectedVideo2Id }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      setWarningMsg(null);
    }
  }, [selectedDayFolderId]); // Keep onVideoSelect out to prevent infinite re-renders

  const handleVideoClick = (fileId: string, fileName: string, webContentLink: string) => {
    setWarningMsg(null);

    // Deselection Logic
    if (selectedVideo1Id === fileId) {
      onVideoSelect(null, 1);
      return;
    }
    if (selectedVideo2Id === fileId) {
      onVideoSelect(null, 2);
      return;
    }

    // Sequential Auto-Fill Logic
    if (!selectedVideo1Id) {
      onVideoSelect(fileId, 1, fileName);
    } else if (!selectedVideo2Id) {
      onVideoSelect(fileId, 2, fileName);
    } else {
      // Both slots are full
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div>
                <h3 className="text-lg font-semibold text-white">Available Videos</h3>
                <p className="text-xs text-gray-400">Click a video to assign it. Click it again to remove it.</p>
            </div>
            
            <div className="flex bg-gray-800 p-1 rounded-lg gap-1">
                <div 
                  className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${selectedVideo1Id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700/50 text-gray-400'}`}
                >
                  <span className={`w-3 h-3 rounded-full ${selectedVideo1Id ? 'bg-white' : 'bg-blue-500/50'}`}></span>
                  {selectedVideo1Id ? 'Skier 1 Selected' : 'Skier 1 Not Selected'}
                </div>
                <div 
                  className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${selectedVideo2Id ? 'bg-green-600 text-white shadow-md' : 'bg-gray-700/50 text-gray-400'}`}
                >
                  <span className={`w-3 h-3 rounded-full ${selectedVideo2Id ? 'bg-white' : 'bg-green-500/50'}`}></span>
                  {selectedVideo2Id ? 'Skier 2 Selected' : 'Skier 2 Not Selected'}
                </div>
            </div>
        </div>

        {error && <p className="text-red-500 my-2">{error}</p>}
        {warningMsg && <p className="text-orange-400 bg-orange-400/10 p-2 rounded border border-orange-400/50 my-2 text-sm">{warningMsg}</p>}
        {isLoading && <p className="text-gray-400 mb-4">Loading video list...</p>}
        
        {!isLoading && videos.length === 0 && (
            <p className="text-gray-400">No videos found for this day.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto p-2">
        {videos.map((video) => {
            const isSelected1 = selectedVideo1Id === video.id;
            const isSelected2 = selectedVideo2Id === video.id;

            let borderClass = 'border-gray-600 hover:border-gray-400';
            if (isSelected1 && isSelected2) borderClass = 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
            else if (isSelected1) borderClass = 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
            else if (isSelected2) borderClass = 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';

            return (
                <div 
                    key={video.id} 
                    onClick={() => handleVideoClick(video.id, video.name, video.webContentLink)} 
                    className={`relative cursor-pointer border-2 rounded-lg bg-gray-800 flex flex-col items-center justify-center p-2 transition-all ${borderClass}`}
                >
                    <div className="w-full aspect-video bg-gray-900 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {video.thumbnailLink ? (
                            <img src={`/api/gdrive/thumbnail?fileId=${video.id}`} alt={video.name} className="object-cover w-full h-full" loading="lazy" />
                        ) : (
                            <span className="text-gray-500">No Thumb</span>
                        )}
                    </div>
                    <span className="text-xs text-center break-all w-full truncate text-white" title={video.name}>
                        {video.name}
                    </span>

                    {/* Status Overlays */}
                    {isSelected1 && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Skier 1
                        </div>
                    )}
                    {isSelected2 && (
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
