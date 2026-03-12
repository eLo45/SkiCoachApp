const fs = require('fs');

let code = fs.readFileSync('synthetic_test.js', 'utf8');

// Add a screenshot right before the timeout to see what's actually on the screen.
code = code.replace(/await page\.waitForFunction\(\(\) => \{/, `
  await page.screenshot({ path: 'before_timeout.png' });
  await page.waitForFunction(() => {
`);

fs.writeFileSync('synthetic_test.js', code);
console.log("Updated test to take a screenshot.");
