'use client';

import React, { useState, useEffect } from 'react';

interface GoogleDrivePickerProps {
  onVideoSelect: (blobUrl: string) => void;
  accessToken: string | null;
  selectedDayFolderId: string | null;
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onVideoSelect, accessToken, selectedDayFolderId }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && selectedDayFolderId) {
      const fetchVideos = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${selectedDayFolderId}' in parents and mimeType contains 'video/'&fields=files(id,name)`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch videos from Google Drive.');
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
    }
  }, [accessToken, selectedDayFolderId]);
  
  const handleVideoClick = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    setLoadingFile(fileName);
    setError(null);
    try {
      const response = await fetch(`/api/gdrive?fileId=${fileId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to download video: ${fileName}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      onVideoSelect(blobUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFile(null);
    }
  };

  if (!selectedDayFolderId) {
    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-white">Videos</h3>
            <p className="text-gray-400">Select a day on the calendar to see the videos.</p>
        </div>
    );
  }

  return (
    <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-white">Videos</h3>
        {error && <p className="text-red-500 my-2">{error}</p>}
        {isLoading && <p className="text-gray-400">Loading video list...</p>}
        <ul className="list-none max-h-48 overflow-y-auto">
        {videos.length > 0 ? videos.map((video) => (
            <li 
            key={video.id} 
            onClick={() => handleVideoClick(video.id, video.name)} 
            className="cursor-pointer hover:bg-gray-700 p-2 rounded text-white flex justify-between items-center"
            >
            <span>{video.name}</span>
            {loadingFile === video.name && <span className="text-sm text-blue-400">Downloading...</span>}
            </li>
        )) : !isLoading && <p className="text-gray-400">No videos found.</p>}
        </ul>
    </div>
  );
};

export default GoogleDrivePicker;
