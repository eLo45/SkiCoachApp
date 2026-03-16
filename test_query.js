const { chromium } = require('playwright');

(async () => {
  console.log("Starting test...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  const url = 'http://localhost:3000/sidebyside?v1=123&s1=1.5,4.2';
  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait a moment for things to render
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'test_query_result.png' });

  // Get the state of sync points from DOM (if possible) or just text
  const content = await page.content();
  if (content.includes('Shared Video 1')) {
    console.log("Found Shared Video 1 text.");
  } else {
    console.log("Did NOT find Shared Video 1 text.");
  }

  if (content.includes('Sync 1: 1.50')) {
    console.log("Found Sync 1 text.");
  } else {
    console.log("Did NOT find Sync 1 text.");
  }

  await browser.close();
})();
