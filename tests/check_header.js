const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (await page.isVisible('#web-auth-screen')) {
    await page.click('#page-auth-demo-autofill');
    await page.click('#page-login-submit-btn');
    await page.waitForTimeout(1200);
  }

  const header = await page.$('.site-header');
  if (header) {
    await header.screenshot({ path: 'scratch/header_cleaned.png' });
    console.log('Header screenshot saved to scratch/header_cleaned.png');
  }
  await page.screenshot({ path: 'scratch/full_page_header_cleaned.png' });
  console.log('Full page screenshot saved to scratch/full_page_header_cleaned.png');
  await browser.close();
})();
