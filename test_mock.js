const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('FAILED REQ:', req.url(), req.failure().errorText));

  // Mock the API response
  await page.route('**/api/gdrive/download*', route => {
    console.log("Intercepted request to:", route.request().url());
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://www.w3schools.com/html/mov_bbb.mp4' })
    });
  });

  const url = 'http://localhost:3000/sidebyside?v1=file123&v2=file456&s1=1.5,4.2&s2=2.0,5.0';
  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000);
  
  const content = await page.content();
  console.log("Has Video 1:", content.includes('<video'));
  console.log("Has Shared Video 1 text:", content.includes('Shared Video 1'));

  await browser.close();
})();
