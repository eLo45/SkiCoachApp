const fs = require('fs');

let code = fs.readFileSync('synthetic_test.js', 'utf8');

// The first click is waiting for the Downloading string to appear. 
// But the UI overlay is rendered *only* if isQueued == true OR downloadProgress !== null.
// Let's print out the exact state of the spans.
const replacement = `
  const spans1 = await page.evaluate(() => Array.from(document.querySelectorAll('span')).map(s => s.innerText));
  console.log("Spans after click:", spans1);
  await page.screenshot({ path: 'before_timeout1.png' });
  await page.waitForFunction(() => {
`;

code = code.replace(/await page\.screenshot\(\{ path: 'before_timeout\.png' \}\);\s*await page\.waitForFunction\(\(\) => \{/m, replacement);

fs.writeFileSync('synthetic_test.js', code);
console.log("Updated test to dump all span text to console.");
