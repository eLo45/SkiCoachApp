const fs = require('fs');
let code = fs.readFileSync('app/sidebyside/page.tsx', 'utf8');

const overlay1 = `
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">
              {isQueued1 && downloadProgress1 === null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white font-bold mb-1">Waiting in Queue...</span>
                      <span className="text-xs text-gray-300">Another video is currently downloading.</span>
                  </div>
              )}
              {downloadProgress1 !== null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="w-full max-w-xs bg-gray-700 rounded-full h-4 mb-4 border border-gray-600 overflow-hidden">
                          <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: \`\${downloadProgress1}%\` }}></div>
                      </div>
                      <span className="text-white font-bold mb-1 text-lg">Downloading: {downloadProgress1}%</span>
                      <span className="text-xs text-gray-300">Caching high-quality video locally for zero-stutter playback.</span>
                  </div>
              )}
              {videoSrc1 ? (
              <video key={videoSrc1} ref={video1Ref} src={videoSrc1} preload="metadata" onLoadedMetadata={() => handleLoadedMetadata(1)} onTimeUpdate={() => { if (video1Ref.current && !isPlaying) setCurrentTime1(video1Ref.current.currentTime); }} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 1</p>
              )}
          </div>
`;

code = code.replace(/<div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">\s*\{isStaging1 && \([\s\S]*?\)\}\s*\{videoSrc1 \? \(\s*<video key=\{videoSrc1\}[^>]*>\s*\) : \(\s*<p className="text-gray-500">Video Player 1<\/p>\s*\)\}\s*<\/div>/m, overlay1);

const overlay2 = `
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">
              {isQueued2 && downloadProgress2 === null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white font-bold mb-1">Waiting in Queue...</span>
                      <span className="text-xs text-gray-300">Another video is currently downloading.</span>
                  </div>
              )}
              {downloadProgress2 !== null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4 text-center">
                      <div className="w-full max-w-xs bg-gray-700 rounded-full h-4 mb-4 border border-gray-600 overflow-hidden">
                          <div className="bg-green-500 h-full transition-all duration-300" style={{ width: \`\${downloadProgress2}%\` }}></div>
                      </div>
                      <span className="text-white font-bold mb-1 text-lg">Downloading: {downloadProgress2}%</span>
                      <span className="text-xs text-gray-300">Caching high-quality video locally for zero-stutter playback.</span>
                  </div>
              )}
              {videoSrc2 ? (
              <video key={videoSrc2} ref={video2Ref} src={videoSrc2} preload="metadata" onLoadedMetadata={() => handleLoadedMetadata(2)} onTimeUpdate={() => { if (video2Ref.current && !isPlaying) setCurrentTime2(video2Ref.current.currentTime); }} className="w-full h-full" controls={false} muted/>
              ) : (
              <p className="text-gray-500">Video Player 2</p>
              )}
          </div>
`;

code = code.replace(/<div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">\s*\{isStaging2 && \([\s\S]*?\)\}\s*\{videoSrc2 \? \(\s*<video key=\{videoSrc2\}[^>]*>\s*\) : \(\s*<p className="text-gray-500">Video Player 2<\/p>\s*\)\}\s*<\/div>/m, overlay2);

fs.writeFileSync('app/sidebyside/page.tsx', code);
console.log('Successfully injected UI queue overlays.');
