'use client';

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarViewProps {
  onDaySelect: (folderId: string, accessToken: string) => void;
  rootFolderId: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onDaySelect, rootFolderId }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, onChange] = useState<any>(new Date());

  useEffect(() => {
    if (accessToken) {
      const fetchFolders = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'&fields=files(id,name)`, {
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
  }, [accessToken, rootFolderId]);

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const folder = folders.find((f: any) => {
        const folderDate = new Date(f.name);
        return date.getFullYear() === folderDate.getFullYear() &&
               date.getMonth() === folderDate.getMonth() &&
               date.getDate() === folderDate.getDate();
      });
      if (folder) {
        return 'highlight';
      }
    }
    return "";
  };

  const handleDateClick = (date: Date) => {
    const folder = folders.find((f: any) => {
      const folderDate = new Date(f.name);
      return date.getFullYear() === folderDate.getFullYear() &&
             date.getMonth() === folderDate.getMonth() &&
             date.getDate() === folderDate.getDate();
    });
    if (folder && accessToken) {
      onDaySelect(folder.id, accessToken);
    }
  };

  if (!accessToken) {
    return (
      <div className="my-4 p-4 border border-gray-700 rounded-lg">
        <p className="text-gray-400 mb-4">Google Drive integration is currently disabled.</p>
        <button disabled className="bg-gray-600 text-white font-bold py-2 px-4 rounded w-full cursor-not-allowed">
          Connect to Google Drive (Disabled)
        </button>
      </div>
    );
  }

  return (
    <div className="my-2 p-4 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-white">Select a Day</h3>
      {error && <p className="text-red-500 my-2">{error}</p>}
      {isLoading && <p className="text-gray-400">Loading folder list...</p>}
      <Calendar
        onChange={onChange}
        value={value}
        onClickDay={handleDateClick}
        tileClassName={tileClassName}
      />
    </div>
  );
};

export default CalendarView;
