const fs = require('fs');

let code = `const { chromium } = require('playwright');

(async () => {
  console.log("Starting synthetic browser test for UI downloading queue...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const targetUrl = 'https://ski-coach-app-dq6mjbvh7q-uc.a.run.app/sidebyside';

  console.log(\`Navigating to \${targetUrl}...\`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  console.log("Waiting for Calendar to load and folders to appear...");
  await page.waitForSelector('text=Folder List');
  
  const folderButtons = await page.locator('button.text-left').elementHandles();
  if (folderButtons.length === 0) {
      console.error("No folders found. Ensure Google Drive is connected.");
      await browser.close();
      return;
  }
  
  let videos = [];
  for (let i = 0; i < folderButtons.length; i++) {
      console.log(\`Clicking on folder: \${await folderButtons[i].innerText()}\`);
      await folderButtons[i].click();
      await page.waitForTimeout(2000); 
      videos = await page.locator('.grid.grid-cols-2 > div').elementHandles();
      if (videos.length >= 2) {
          console.log(\`Found \${videos.length} videos in this folder! Proceeding with test.\`);
          break;
      }
  }

  if (videos.length < 2) {
      console.error("Could not find any folder with at least 2 videos to test side-by-side.");
      await browser.close();
      return;
  }

  console.log(\`Clicking Skier 1...\`);
  await videos[0].click();
  
  // Wait to see the downloading overlay
  await page.waitForSelector('text=Downloading:', { timeout: 10000 });
  console.log("✅ Skier 1 entered downloading state.");

  console.log(\`Clicking Skier 2...\`);
  await videos[1].click();

  // Instantly, Skier 2 should be queued
  await page.waitForSelector('text=Waiting in Queue...', { timeout: 5000 });
  console.log("✅ Skier 2 successfully queued!");

  // Wait for Skier 1 to finish downloading (the loading bar vanishes and video tag gets a src blob)
  console.log("Waiting for Skier 1 to finish downloading (this may take up to 60s)...");
  
  try {
      // Skier 1 downloading text should vanish
      await page.waitForFunction(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          return !spans.some(s => s.innerText.includes('Downloading: ') && s.closest('.aspect-video')?.previousElementSibling?.textContent?.includes('Skier 1'));
      }, { timeout: 60000 });
      console.log("✅ Skier 1 download complete!");
  } catch(e) {
      console.error("❌ Skier 1 download timed out or failed to vanish.");
  }

  // Once Skier 1 vanishes, Skier 2 should transition from Queued to Downloading
  console.log("Checking if Skier 2 transitioned to downloading state...");
  try {
      await page.waitForSelector('text=Downloading:', { timeout: 10000 });
      console.log("✅ Skier 2 successfully transitioned from Queued to Downloading!");
  } catch(e) {
       console.error("❌ Skier 2 failed to transition to downloading.");
  }

  console.log("Waiting for Skier 2 to finish downloading...");
  try {
      await page.waitForFunction(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          return !spans.some(s => s.innerText.includes('Downloading: '));
      }, { timeout: 60000 });
      console.log("✅ Skier 2 download complete!");
  } catch(e) {
      console.error("❌ Skier 2 download timed out.");
  }

  console.log("Verifying videos are loaded into players with blobs...");
  const srcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video')).map(v => v.src);
  });
  
  console.log("Video SRCs:", srcs);
  if (srcs.length === 2 && srcs[0].startsWith('blob:') && srcs[1].startsWith('blob:')) {
      console.log("✅ Both videos successfully loaded into memory blobs.");
  } else {
      console.error("❌ Videos are not valid blobs.");
  }

  console.log("Test completed.");
  await browser.close();
})();
`;

fs.writeFileSync('synthetic_test.js', code);
console.log("Rewrote synthetic test to target the Queue Manager UI.");
