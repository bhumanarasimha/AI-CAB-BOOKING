const puppeteer = require('puppeteer');

(async () => {
  console.log('--- TESTING RIDE COMPARISON BUTTONS ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });

    const logs = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));

    console.log('Navigating to http://localhost:5173/user/ride-comparison ...');
    await page.goto('http://localhost:5173/user/ride-comparison', { waitUntil: 'networkidle2', timeout: 15000 });

    // Wait for ride cards
    await page.waitForSelector('button', { timeout: 10000 });
    console.log('Page loaded successfully!');

    // Find all buttons on the page
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, span')).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        visible: el.offsetParent !== null
      })).filter(b => b.text.length > 0 && b.text.length < 50);
    });

    console.log('\nButtons found on Ride Comparison screen:');
    buttons.slice(0, 15).forEach((b, i) => console.log(`  ${i+1}. [${b.tag}] "${b.text}"`));

    // Test clicking the SmartRide AI option
    console.log('\nTesting click on SmartRide AI booking button...');
    const smartRideClicked = await page.evaluate(() => {
      const allSpans = Array.from(document.querySelectorAll('span, button'));
      const btn = allSpans.find(s => s.innerText && s.innerText.includes('Book AI'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('SmartRide AI Book button clicked:', smartRideClicked);

    // Wait a brief moment for navigation
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL after SmartRide click:', page.url());

    // Check if Activity page loaded
    const isActivity = page.url().includes('/user/activity');
    console.log('Navigated to Activity:', isActivity ? 'YES (SUCCESS)' : 'NO');

    console.log('\n--- Console Logs ---');
    logs.slice(-10).forEach(l => console.log(l));

    console.log('\nTEST RESULT:', isActivity ? 'PASS' : 'FAIL');
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    if (browser) await browser.close();
  }
})();
