
'use client';

import React, { useState, useEffect } from 'react';
import { useGoogleLogin, TokenResponse } from '@react-oauth/google';

interface CalendarViewProps {
  onFolderSelect: (folderId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onFolderSelect }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse: TokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    onError: () => {
      setError('Google login failed.');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  useEffect(() => {
    if (accessToken) {
      const fetchFolders = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType = 'application/vnd.google-apps.folder' and 'me' in owners&fields=files(id,name)", {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch folder list from Google Drive.');
          }
          const data = await response.json();
          setFolders(data.files || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFolders();
    }
  }, [accessToken]);

  const handleFolderClick = (folderId: string) => {
    onFolderSelect(folderId);
  };

  if (!accessToken) {
    return (
      <div className="my-4 p-4 border border-gray-700 rounded-lg">
        <button onClick={() => login()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Connect to Google Drive
        </button>
      </div>
    );
  }

  return (
    <div className="my-2 p-4 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-white">Select Your Root Ski Folder</h3>
      {error && <p className="text-red-500 my-2">{error}</p>}
      {isLoading && <p className="text-gray-400">Loading folder list...</p>}
      <ul className="list-none max-h-48 overflow-y-auto">
        {folders.length > 0 ? folders.map((folder) => (
          <li 
            key={folder.id} 
            onClick={() => handleFolderClick(folder.id)} 
            className="cursor-pointer hover:bg-gray-700 p-2 rounded text-white"
          >
            {folder.name}
          </li>
        )) : !isLoading && <p className="text-gray-400">No folders found.</p>}
      </ul>
    </div>
  );
};

export default CalendarView;
