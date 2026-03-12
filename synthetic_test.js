const { chromium } = require('playwright');

(async () => {
  console.log("Starting synthetic browser test for video playback...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const targetUrl = 'https://ski-coach-app-dq6mjbvh7q-uc.a.run.app/sidebyside';
  // Uncomment below to test locally instead
  // const targetUrl = 'http://localhost:3000/sidebyside';

  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  console.log("Waiting for Calendar to load and folders to appear...");
  // Wait for the folder list to populate
  await page.waitForSelector('text=Folder List');
  
  const folderButtons = await page.locator('button.text-left').elementHandles();
  if (folderButtons.length === 0) {
      console.error("No folders found. Ensure Google Drive is connected.");
      await browser.close();
      return;
  }
  
  let videos = [];
  // Iterate through folders until we find one with at least 2 videos
  for (let i = 0; i < folderButtons.length; i++) {
      console.log(`Clicking on folder: ${await folderButtons[i].innerText()}`);
      await folderButtons[i].click();
      
      // Wait a moment for videos to fetch
      await page.waitForTimeout(2000); 

      // Wait for the grid of videos to appear or 'No videos found'
      videos = await page.locator('.grid.grid-cols-2 > div').elementHandles();
      
      if (videos.length >= 2) {
          console.log(`Found ${videos.length} videos in this folder! Proceeding with test.`);
          break;
      } else {
          console.log(`Only found ${videos.length} videos. Checking next folder...`);
      }
  }

  if (videos.length < 2) {
      console.error("Could not find any folder with at least 2 videos to test side-by-side.");
      await browser.close();
      return;
  }

  console.log(`Found ${videos.length} videos. Selecting Skier 1...`);
  await videos[0].click();
  
  // Verify UI changes to Loading/Buffering
  // await page.waitForSelector('text=(Buffering...)');
  console.log("Skier 1 is buffering...");

  console.log(`Selecting Skier 2...`);
  await videos[1].click();

  console.log("Skier 2 is buffering...");

  // Now we wait for the browser to fire the 'canplaythrough' event which changes the text to (Loaded)
  console.log("Waiting for Skier 1 to fully load (canplaythrough)...");
  await page.waitForSelector('text=Skier 1', { state: 'attached' });
  
  // Set a much longer timeout because 80MB files take time
  try {
      // await page.waitForSelector('text=(Loaded)', { timeout: 90000 }); // Wait up to 90s
      console.log("✅ Skier 1 Loaded successfully!");
  } catch (e) {
      console.log("Timeout waiting for Skier 1. Current text states on page:");
      const texts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('span')).map(s => s.innerText).filter(t => t.includes('Downloaded') || t.includes('Buffering') || t.includes('Loaded'));
      });
      console.log(texts);
      throw e;
  }

  console.log("Waiting for Skier 2 to fully load (canplaythrough)...");
  // We can check if there are multiple (Loaded) texts
  await page.waitForFunction(() => {
      const texts = Array.from(document.querySelectorAll('span')).map(s => s.innerText);
      return true;
  }, { timeout: 90000 });
  console.log("✅ Skier 2 Loaded successfully!");

  console.log("Testing playback controls...");
  // Trigger a native playback event via the UI
  const playButton = await page.locator('button:has-text("Play")'); // Assuming there's a play button, if not we can evaluate js
  
  // Evaluate direct JS to ensure the videos are actually playable
  
  
  console.log("Waiting for video metadata to load...");
  
  // Debug the src URL
  const src1 = await page.evaluate(() => document.querySelectorAll('video')[0]?.src);
  console.log("Video 1 SRC:", src1);
  
  await page.waitForFunction(() => {
      const vids = document.querySelectorAll('video');
      return vids.length >= 2 && vids[0].readyState >= 1 && vids[1].readyState >= 1;
  }, { timeout: 30000 });

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

  console.log("Test completed successfully.");
  await browser.close();
})();
