const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('request', req => console.log('REQ:', req.url()));
  page.on('response', async res => {
    if (res.url().includes('/api/gdrive/download')) {
      console.log('RES:', res.status(), await res.text());
    }
  });

  const url = 'https://ski-coach-app-872631191817.us-central1.run.app/sidebyside?v1=1563sAqUmOfJeWUFtMc-8iNMFwUHW9yhV&s1=1.5,4.2';
  await page.goto(url, { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
