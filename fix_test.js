const fs = require('fs');

let code = fs.readFileSync('synthetic_test.js', 'utf8');

// The DOM structure we found has texts like '0.00s / 0.00s' and 'IMG_7530.MOV'.
// Let's add browser console logging to the test so we can see ANY errors thrown by the page during execution.
const replacement = `
  console.log("Navigating to " + targetUrl);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
`;

code = code.replace(/console\.log\(\`Navigating to \$\{targetUrl\}\.\.\.\`\);/g, replacement);

fs.writeFileSync('synthetic_test.js', code);
console.log("Added browser console mirroring to synthetic test.");
