const fs = require('fs');

let code = fs.readFileSync('app/sidebyside/page.tsx', 'utf8');

const replacement = `
            xhr.onload = () => {
              console.log('QUEUE: XHR Onload', xhr.status);

              if (xhr.status === 200 || xhr.status === 206) {
                if (currentSrc && currentSrc.startsWith('blob:')) URL.revokeObjectURL(currentSrc);
                
                // Explicitly define the MIME type to prevent the browser from rejecting application/octet-stream
                // We default to video/mp4, but standard quicktime/mov works fine in Chrome when cast to mp4 type.
                const finalBlob = new Blob([xhr.response], { type: 'video/mp4' });
                const blobUrl = URL.createObjectURL(finalBlob);
                
                setSrc(blobUrl);
                setProgress(null);
`;

code = code.replace(/xhr\.onload = \(\) => \{\s*console\.log\('QUEUE: XHR Onload', xhr\.status\);\s*if \(xhr\.status === 200 \|\| xhr\.status === 206\) \{\s*if \(currentSrc && currentSrc\.startsWith\('blob:'\)\) URL\.revokeObjectURL\(currentSrc\);\s*const blobUrl = URL\.createObjectURL\(xhr\.response\);\s*setSrc\(blobUrl\);\s*setProgress\(null\);/m, replacement);

fs.writeFileSync('app/sidebyside/page.tsx', code);
console.log("Updated blob creation logic.");
