const { chromium } = require('playwright');

(async () => {
  console.log("Starting synthetic browser test for UI downloading queue...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  const targetUrl = 'https://ski-coach-app-dq6mjbvh7q-uc.a.run.app/sidebyside';

  console.log(`Navigating to ${targetUrl}`);
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
      console.log(`Clicking on folder: ${await folderButtons[i].innerText()}`);
      await folderButtons[i].click();
      await page.waitForTimeout(2000); 
      videos = await page.locator('.grid.grid-cols-2 > div').elementHandles();
      if (videos.length >= 2) {
          console.log(`Found ${videos.length} videos in this folder! Proceeding with test.`);
          break;
      }
  }

  if (videos.length < 2) {
      console.error("Could not find any folder with at least 2 videos to test side-by-side.");
      await browser.close();
      return;
  }

  console.log(`Clicking Skier 1...`);
  await videos[0].click();
  
  // Wait for the video element to actually appear, meaning the blob was set
  console.log("Waiting for Video 1 to render...");
  await page.waitForSelector('video', { timeout: 60000 });
  console.log("✅ Skier 1 video tag rendered.");

  console.log(`Clicking Skier 2...`);
  await videos[1].click();

  console.log("Waiting for Video 2 to render...");
  // Wait until there are exactly 2 video elements
  await page.waitForFunction(() => document.querySelectorAll('video').length === 2, { timeout: 60000 });
  console.log("✅ Skier 2 video tag rendered.");

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

  console.log("Waiting for video metadata to load...");
  await page.waitForFunction(() => {
      const vids = document.querySelectorAll('video');
      return vids.length >= 2 && vids[0].readyState >= 1 && vids[1].readyState >= 1;
  }, { timeout: 30000 });
  console.log("✅ Video metadata loaded.");

  console.log("Testing playback controls...");
  const isPlaying = await page.evaluate(async () => {
      const vids = document.querySelectorAll('video');
      if (vids.length < 2) return false;
      
      try {
          await vids[0].play();
          await vids[1].play();
          return !vids[0].paused && !vids[1].paused;
      } catch (e) {
          console.log("Play error:", e.message);
          return false;
      }
  });

  if (isPlaying) {
      console.log("✅ Both videos successfully started playing concurrently.");
  } else {
      console.error("❌ Videos failed to play.");
  }

  console.log("Test completed.");
  await browser.close();
})();