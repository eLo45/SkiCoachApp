'use client';

import React, { useState, useEffect } from 'react';
// A test comment
import { useGoogleLogin } from '@react-oauth/google';
import CalendarView from './CalendarView'; // Import the new component

interface GoogleDrivePickerProps {
  onVideoSelect: (blobUrl: string) => void;
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onVideoSelect }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [dayFolders, setDayFolders] = useState<any[]>([]);
  const [selectedDayFolderId, setSelectedDayFolderId] = useState<string | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    onError: () => {
      setError('Google login failed.');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  useEffect(() => {
    if (accessToken && rootFolderId) {
      const fetchDayFolders = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'&fields=files(id,name)`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch day folders from Google Drive.');
          }
          const data = await response.json();
          setDayFolders(data.files || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDayFolders();
    }
  }, [accessToken, rootFolderId]);

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
        } catch (err: any) => {
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

  const handleFolderSelect = (folderId: string) => {
    console.log("Selected root folder: ", folderId);
    setRootFolderId(folderId);
  };

  if (!accessToken) {
    return (
      <div className="my-4 p-4 border border-gray-700 rounded-lg">
        <button onClick={() => login()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Import Video from Google Drive
        </button>
      </div>
    );
  }

  if (!rootFolderId) {
    return <CalendarView onFolderSelect={handleFolderSelect} />;
  }

  return (
    <div className="my-2 p-4 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-white">Select a Day</h3>
      <div className="flex flex-wrap gap-2">
        {dayFolders.map(folder => (
          <button 
            key={folder.id} 
            onClick={() => setSelectedDayFolderId(folder.id)}
            className={`py-2 px-4 rounded ${selectedDayFolderId === folder.id ? 'bg-blue-800' : 'bg-blue-600'} hover:bg-blue-700 text-white`}
          >
            {folder.name}
          </button>
        ))}
      </div>

      {selectedDayFolderId && (
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
      )}
    </div>
  );
};

export default GoogleDrivePicker;
