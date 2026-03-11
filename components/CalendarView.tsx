'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarViewProps {
  onDaySelect: (folderId: string) => void;
  rootFolderId: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onDaySelect, rootFolderId }) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track selected date for the Calendar and selected index for the List
  const [value, onChange] = useState<any>(new Date());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (rootFolderId) {
      const fetchFolders = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/gdrive/folders?rootFolderId=${rootFolderId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch folder list from server.');
          }
          const data = await response.json();
          // Assume the API returns them, but let's ensure they are sorted so the list view makes sense chronologically
          const sortedFolders = (data.files || []).sort((a: any, b: any) => b.name.localeCompare(a.name));
          setFolders(sortedFolders);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFolders();
    }
  }, [rootFolderId]);

  const parseFolderDate = (folderName: string): Date | null => {
    // Looks for a date prefix like YYYY.MM.DD or YYYY.M.D
    const match = folderName.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const folder = folders.find((f: any) => {
        const folderDate = parseFolderDate(f.name);
        if (!folderDate) return false;
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

  const handleFolderSelect = (folder: any, index: number) => {
    const folderDate = parseFolderDate(folder.name);
    if (folderDate) {
        onChange(folderDate); // Sync calendar UI
    }
    setSelectedIndex(index);
    onDaySelect(folder.id);
  };

  const handleDateClick = (date: Date) => {
    const index = folders.findIndex((f: any) => {
      const folderDate = parseFolderDate(f.name);
      if (!folderDate) return false;
      return date.getFullYear() === folderDate.getFullYear() &&
             date.getMonth() === folderDate.getMonth() &&
             date.getDate() === folderDate.getDate();
    });
    
    if (index !== -1) {
      handleFolderSelect(folders[index], index);
    }
  };

  // Compute the 9-item window for the List View
  const visibleFolders = useMemo(() => {
    if (folders.length === 0) return [];
    if (folders.length <= 9) return folders.map((f, i) => ({ folder: f, originalIndex: i }));

    // If nothing selected, just show the top 9
    let centerIndex = selectedIndex !== null ? selectedIndex : 0;
    
    let startIndex = centerIndex - 4;
    let endIndex = centerIndex + 4;

    // Edge cases
    if (startIndex < 0) {
      startIndex = 0;
      endIndex = 8;
    } else if (endIndex >= folders.length) {
      endIndex = folders.length - 1;
      startIndex = folders.length - 9;
    }

    return folders.slice(startIndex, endIndex + 1).map((f, idx) => ({
      folder: f,
      originalIndex: startIndex + idx
    }));
  }, [folders, selectedIndex]);

  return (
    <div className="my-2 p-4 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Select a Training Day</h3>
      {error && <p className="text-red-500 my-2">{error}</p>}
      {isLoading && <p className="text-gray-400 mb-2">Loading folders from Google Drive...</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Calendar */}
        <div className="flex justify-center w-full">
          <Calendar
            onChange={onChange as any} // react-calendar type workaround
            value={value}
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            className="w-full max-w-sm"
          />
        </div>

        {/* Right: List View */}
        <div className="flex flex-col gap-2 h-[350px] overflow-hidden bg-gray-800 p-4 rounded-lg border border-gray-700">
           <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider text-center border-b border-gray-700 pb-2">Recent Folders</h4>
           {visibleFolders.length === 0 && !isLoading && (
               <p className="text-gray-500 text-center mt-4">No folders found.</p>
           )}
           <div className="flex flex-col gap-1.5 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {visibleFolders.map(({ folder, originalIndex }) => {
                  const isSelected = originalIndex === selectedIndex;
                  return (
                      <button
                          key={folder.id}
                          onClick={() => handleFolderSelect(folder, originalIndex)}
                          className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors break-all truncate w-full ${
                              isSelected 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          }`}
                          title={folder.name}
                      >
                          {folder.name}
                      </button>
                  );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
