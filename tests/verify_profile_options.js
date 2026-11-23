const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (await page.isVisible('#web-auth-screen')) {
    await page.click('#page-auth-demo-autofill');
    await page.click('#page-login-submit-btn');
    await page.waitForTimeout(1200);
  }

  // 1. Capture clean top navbar
  const navBar = await page.$('.nav-tabs');
  if (navBar) {
    await navBar.screenshot({ path: 'scratch/clean_top_navbar.png' });
    console.log('Saved clean top navbar screenshot to scratch/clean_top_navbar.png');
  }

  // 2. Open Profile page
  await page.click('#tab-profile');
  await page.waitForTimeout(600);

  // 3. Capture the full profile page with arranged options
  const profileSection = await page.$('#section-profile');
  if (profileSection) {
    await profileSection.screenshot({ path: 'scratch/profile_page_options_arranged.png' });
    console.log('Saved profile page screenshot to scratch/profile_page_options_arranged.png');
  }

  // 4. Test clicking an option from the profile hub (e.g. Saved Places)
  const savedPlacesBtn = await page.$('.profile-option-item[data-target="places"]');
  if (savedPlacesBtn) {
    await savedPlacesBtn.click();
    await page.waitForTimeout(600);
    const placesVisible = await page.isVisible('#section-places');
    console.log('1-Tap Navigation to Saved Places from Profile Hub:', placesVisible ? 'SUCCESS' : 'FAILED');
    await page.screenshot({ path: 'scratch/places_from_profile_hub.png' });

    // Click back to profile
    const backBtn = await page.$('#section-places .back-to-prev-btn');
    if (backBtn) {
      await backBtn.click();
      await page.waitForTimeout(400);
      const profileBackVisible = await page.isVisible('#section-profile');
      console.log('Return back to Profile screen:', profileBackVisible ? 'SUCCESS' : 'FAILED');
    }
  }

  await browser.close();
  console.log('Verification finished successfully!');
})();
