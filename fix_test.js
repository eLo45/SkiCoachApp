const fs = require('fs');
let code = fs.readFileSync('synthetic_test.js', 'utf8');

const replacement = `
  console.log("Waiting for video metadata to load...");
  await page.waitForFunction(() => {
      const vids = document.querySelectorAll('video');
      return vids.length >= 2 && vids[0].readyState >= 1 && vids[1].readyState >= 1;
  }, { timeout: 30000 });

  const isPlaying = await page.evaluate(async () => {
`;

code = code.replace(/const isPlaying = await page\.evaluate\(async \(\) => {/g, replacement);

fs.writeFileSync('synthetic_test.js', code);
console.log('Fixed syntax error in test script.');
