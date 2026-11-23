const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:8080 ...');
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // If auth screen is visible, log in with demo account
  if (await page.isVisible('#web-auth-screen')) {
    console.log('Signing in via demo button...');
    await page.click('#page-auth-demo-autofill');
    await page.click('#page-login-submit-btn');
    await page.waitForTimeout(1200);
  }

  // 1. Check floating buttons on page
  const chubbyFab = await page.$('#chubby-ai-fab');
  const chatbotToggle = await page.$('#chatbot-toggle-btn');
  const floatingMic = await page.$('.chubby-voice-fab-btn');

  console.log('Chubby FAB exists:', !!chubbyFab);
  console.log('Separate Chatbot Toggle exists:', !!chatbotToggle);
  console.log('Separate Floating Mic exists:', !!floatingMic);

  // Take screenshot of landing page showing bottom right corner
  const artifactDir = 'C:\\Users\\NARASIMHA\\.gemini\\antigravity\\brain\\29c4b434-6f9f-49d9-b8da-101cbc26ca2c\\test_screenshots';
  await page.screenshot({ path: path.join(artifactDir, 'unified_chubby_fab_screen.png') });
  console.log('Captured unified_chubby_fab_screen.png');

  // 2. Click the unified Chubby AI FAB
  if (chubbyFab) {
    console.log('Clicking Chubby AI FAB...');
    await chubbyFab.click();
    await page.waitForTimeout(800);

    // Verify modal is open and chat tab is active
    const modalVisible = await page.$eval('#chubby-ai-modal', el => window.getComputedStyle(el).display !== 'none');
    console.log('Chubby AI Modal Visible:', modalVisible);

    const activeTab = await page.$eval('.chubby-tab-btn.active', el => el.textContent.trim());
    console.log('Active Chubby Tab:', activeTab);

    await page.screenshot({ path: path.join(artifactDir, 'unified_chubby_modal_chat_tab.png') });
    console.log('Captured unified_chubby_modal_chat_tab.png');

    // 3. Click the "⚡ Radar" quick chip
    const radarChip = await page.$('.chat-chip[data-query*="Radar"]');
    if (radarChip) {
      console.log('Clicking ⚡ Radar quick chip...');
      await radarChip.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(artifactDir, 'unified_chubby_chat_response.png') });
      console.log('Captured unified_chubby_chat_response.png');
    }

    // 4. Switch to Voice AI tab inside Chubby AI
    const voiceTab = await page.$('#chubby-tab-voice');
    if (voiceTab) {
      console.log('Switching to Voice AI tab...');
      await voiceTab.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(artifactDir, 'unified_chubby_voice_tab.png') });
      console.log('Captured unified_chubby_voice_tab.png');
    }

    // 5. Close modal
    const closeBtn = await page.$('#chubby-modal-close');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 6. Test mobile viewport (390x844 - iPhone / Android)
  console.log('Testing mobile viewport 390x844...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, 'unified_chubby_mobile_screen.png') });
  console.log('Captured unified_chubby_mobile_screen.png');

  // Open Chubby AI on mobile
  const mobileFab = await page.$('#chubby-ai-fab');
  if (mobileFab) {
    await mobileFab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'unified_chubby_mobile_modal.png') });
    console.log('Captured unified_chubby_mobile_modal.png');
  }

  await browser.close();
  console.log('Verification finished successfully!');
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
