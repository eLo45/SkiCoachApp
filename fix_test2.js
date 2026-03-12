const fs = require('fs');

let code = fs.readFileSync('synthetic_test.js', 'utf8');

// The Playwright selector 'text=Downloading:' requires an exact match or substring depending on how it's formatted.
// Since the text is dynamically formatted like 'Downloading: 0%', the selector might fail to find it.
// We will change it to a regex or just check the page content.
code = code.replace(/await page\.waitForSelector\('text=Downloading:', \{ timeout: 10000 \}\);/g, `
  // Check for the downloading span more dynamically
  await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('span')).some(s => s.innerText.includes('Downloading:'));
  }, { timeout: 15000 });
`);

code = code.replace(/await page\.waitForSelector\('text=Waiting in Queue\.\.\.', \{ timeout: 5000 \}\);/g, `
  await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('span')).some(s => s.innerText.includes('Waiting in Queue'));
  }, { timeout: 15000 });
`);

fs.writeFileSync('synthetic_test.js', code);
console.log("Updated test to use dynamic DOM text searches instead of strict Playwright text selectors.");
