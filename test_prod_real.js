const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const url = 'https://ski-coach-app-872631191817.us-central1.run.app/sidebyside?v1=1563sAqUmOfJeWUFtMc-8iNMFwUHW9yhV&s1=1.5,4.2';
  await page.goto(url, { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000);
  
  const span = await page.locator('label').first().innerText();
  console.log("Label text:", span);

  const video = await page.locator('video').count();
  console.log("Video count:", video);
  
  const syncs = await page.locator('div.text-xs.text-gray-400').first().innerText();
  console.log("Syncs text:", syncs);

  await browser.close();
})();
