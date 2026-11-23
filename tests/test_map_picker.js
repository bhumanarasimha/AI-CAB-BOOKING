const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['geolocation'],
    geolocation: { latitude: 13.0827, longitude: 80.2707 }
  });

  const page = await context.newPage();

  // Set user auth in localStorage before loading
  await page.addInitScript(() => {
    localStorage.setItem('smartride_token', 'demo_token');
    localStorage.setItem('smartride_user', JSON.stringify({ id: 'demo_1', name: 'Narasimha', role: 'user', email: 'rider@smartride.ai' }));
    localStorage.setItem('smartride_onboarded', 'true');
  });

  console.log('Navigating to http://localhost:5173/#/user/home ...');
  await page.goto('http://localhost:5173/#/user/home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const artifactDir = 'C:\\Users\\NARASIMHA\\.gemini\\antigravity\\brain\\29c4b434-6f9f-49d9-b8da-101cbc26ca2c\\test_screenshots';
  await page.screenshot({ path: path.join(artifactDir, 'android_home_with_hash.png') });
  console.log('Saved android_home_with_hash.png');

  // Now navigate to http://localhost:5173/#/user/map-picker
  console.log('Navigating to http://localhost:5173/#/user/map-picker...');
  await page.goto('http://localhost:5173/#/user/map-picker', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Check if error boundary is triggered
  const hasError = await page.isVisible('text="The application encountered a display issue"');
  console.log('MapPicker has ErrorBoundary:', hasError);

  if (hasError) {
    const errorMsg = await page.innerText('body');
    console.log('Error screen content:', errorMsg);
  }

  await page.screenshot({ path: path.join(artifactDir, 'android_map_picker_success.png') });
  console.log('Saved android_map_picker_success.png');

  // Check if address or coords are displayed
  const pTexts = await page.locator('p').allInnerTexts();
  console.log('Paragraph texts on MapPicker:', pTexts.filter(t => t.length > 0 && t.length < 80));

  // Check confirm button
  const confirmBtn = await page.locator('button.btn-primary').first();
  if (confirmBtn) {
    const btnText = await confirmBtn.innerText();
    console.log('Confirm Button Text:', btnText);
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    console.log('URL after confirm:', page.url());
    await page.screenshot({ path: path.join(artifactDir, 'android_home_after_confirm.png') });
    console.log('Saved android_home_after_confirm.png');
  }

  await browser.close();
  console.log('All tests completed successfully!');
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
