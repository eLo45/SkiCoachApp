const fs = require('fs');
let code = fs.readFileSync('app/sidebyside/page.tsx', 'utf8');

// The replacement script failed to run because I cancelled the command previously before it finished executing. 
// I need to run the UI update again to put the correct progress circles back in.

const replacement1 = `
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">
              {isQueued1 && downloadProgress1 === null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white font-bold mb-1 text-lg">Waiting in Queue...</span>
                      <span className="text-xs text-gray-300">Another video is currently downloading to cache.</span>
                  </div>
              )}
              {downloadProgress1 !== null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                          <svg className="absolute w-full h-full text-gray-700" viewBox="0 0 36 36">
                              <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100, 100" />
                              <path className="text-blue-500 transition-all duration-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={\`\${downloadProgress1}, 100\`} />
                          </svg>
                          <svg className="w-6 h-6 text-blue-500 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </div>
                      <span className="text-white font-bold mb-1 text-xl">{downloadProgress1}%</span>
                      <span className="text-xs text-gray-300">Downloading video locally for flawless scrubbing...</span>
                  </div>
              )}
              {videoSrc1 ? (
              <video key={videoSrc1} ref={video1Ref} src={videoSrc1} preload="metadata" onLoadedMetadata={() => handleLoadedMetadata(1)} onTimeUpdate={() => { if (video1Ref.current && !isPlaying) setCurrentTime1(video1Ref.current.currentTime); }} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 1</p>
              )}
          </div>
`;

code = code.replace(/<div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">[\s\S]*?<button\s+onClick=\{\(\) => handleMarkSync\(1\)\}/m, replacement1 + "\n          <button \n            onClick={() => handleMarkSync(1)}");

const replacement2 = `
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">
              {isQueued2 && downloadProgress2 === null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white font-bold mb-1 text-lg">Waiting in Queue...</span>
                      <span className="text-xs text-gray-300">Another video is currently downloading to cache.</span>
                  </div>
              )}
              {downloadProgress2 !== null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                          <svg className="absolute w-full h-full text-gray-700" viewBox="0 0 36 36">
                              <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100, 100" />
                              <path className="text-green-500 transition-all duration-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={\`\${downloadProgress2}, 100\`} />
                          </svg>
                          <svg className="w-6 h-6 text-green-500 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </div>
                      <span className="text-white font-bold mb-1 text-xl">{downloadProgress2}%</span>
                      <span className="text-xs text-gray-300">Downloading video locally for flawless scrubbing...</span>
                  </div>
              )}
              {videoSrc2 ? (
              <video key={videoSrc2} ref={video2Ref} src={videoSrc2} preload="metadata" onLoadedMetadata={() => handleLoadedMetadata(2)} onTimeUpdate={() => { if (video2Ref.current && !isPlaying) setCurrentTime2(video2Ref.current.currentTime); }} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 2</p>
              )}
          </div>
`;

code = code.replace(/<div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">[\s\S]*?<button\s+onClick=\{\(\) => handleMarkSync\(2\)\}/m, replacement2 + "\n           <button \n            onClick={() => handleMarkSync(2)}");

// Remove the old horizontal bars if they somehow survived
code = code.replace(/\{downloadProgress1 !== null && \([\s\S]*?\}\)\}/g, '');
code = code.replace(/\{downloadProgress2 !== null && \([\s\S]*?\}\)\}/g, '');

fs.writeFileSync('app/sidebyside/page.tsx', code);
console.log('UI updated');
