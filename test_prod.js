const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PROD CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PROD ERROR:', err.message));
  page.on('requestfailed', req => console.log('FAILED REQ:', req.url(), req.failure().errorText));

  const url = 'https://ski-coach-app-872631191817.us-central1.run.app/sidebyside?v1=123&s1=1.5,4.2';
  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000);
  const content = await page.content();
  console.log("Has Shared Video 1 text:", content.includes('Shared Video 1'));
  console.log("Has Video Element:", content.includes('<video'));
  await browser.close();
})();
