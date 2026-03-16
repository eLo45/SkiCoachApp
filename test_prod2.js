const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PROD CONSOLE:', msg.text()));

  const url = 'https://ski-coach-app-872631191817.us-central1.run.app/sidebyside?v1=123&s1=1.5,4.2';
  await page.goto(url, { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000);
  
  const h1 = await page.locator('h1').textContent();
  console.log("H1:", h1);
  
  const span = await page.locator('span.text-blue-200.font-bold').textContent().catch(()=>null);
  console.log("Span text:", span);

  await browser.close();
})();
