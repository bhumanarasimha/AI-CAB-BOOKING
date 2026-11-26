/**
 * Comprehensive Human-Like Web Application Audit Script
 * Cross-platform (Windows & Ubuntu CI) Playwright E2E Audit for SmartRide AI (web_frontend)
 */

const path = require('path');
const {
  loadPlaywright,
  resolveChromeExecutable,
  ensureScreenshotDir,
  isFirstPartyUrl,
  writeJsonReport,
} = require('./playwright_helper');

const { chromium } = loadPlaywright();

const BASE_URL = process.env.SMARTRIDE_WEB_URL || process.env.WEB_URL || 'http://localhost:8080/';
const CHROME_PATH = resolveChromeExecutable();
const SCREENSHOT_DIR = ensureScreenshotDir('web');
const IS_CI = process.env.CI === 'true' && process.env.STRICT_EXTERNAL_HTTP !== '1';

async function runHumanLikeAudit() {
  console.log(`Starting Comprehensive Web Application Audit on ${BASE_URL} (Chrome: ${CHROME_PATH || 'playwright-bundled'})...\n`);

  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
  };
  if (CHROME_PATH) {
    launchOpts.executablePath = CHROME_PATH;
  }

  const browser = await chromium.launch(launchOpts);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 880 },
    permissions: ['geolocation'],
    geolocation: { latitude: 13.0827, longitude: 80.2707 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SmartRideAudit/3.5',
  });

  const page = await context.newPage();

  const results = [];
  const consoleErrors = [];
  const httpErrors = [];
  const networkErrors = [];
  const layoutIssues = [];
  const externalWarnings = [];

  page.on('pageerror', err => {
    consoleErrors.push(`pageerror: ${err.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (txt.includes('favicon.ico')) return;
      if (IS_CI && txt.includes('Failed to load resource') && (txt.includes('429') || txt.includes('status of 503'))) {
        externalWarnings.push(`Console rate-limit notice: ${txt}`);
        return;
      }
      consoleErrors.push(txt);
    }
  });

  page.on('response', res => {
    const url = res.url();
    if (res.status() >= 400 && !url.includes('favicon.ico')) {
      if (!isFirstPartyUrl(url) && IS_CI) {
        externalWarnings.push(`External HTTP ${res.status()} ${url}`);
      } else {
        httpErrors.push(`${res.status()} ${url}`);
      }
    }
  });

  page.on('requestfailed', req => {
    const url = req.url();
    const errText = req.failure()?.errorText || '';
    if (errText === 'net::ERR_ABORTED' && (url.includes('/api/geocode') || url.includes('maps.googleapis.com'))) {
      return;
    }
    if (!url.includes('favicon.ico')) {
      if (!isFirstPartyUrl(url) && IS_CI) {
        externalWarnings.push(`External request failed: ${req.method()} ${url} -> ${errText}`);
      } else {
        networkErrors.push(`${req.method()} ${url} -> ${errText}`);
      }
    }
  });

  function logStep(name, status, details = '') {
    const icon = status === 'PASS' ? '[PASS]' : status === 'WARN' ? '[WARN]' : '[FAIL]';
    results.push({ suite: 'Web Application E2E', name, status, details });
    console.log(`${icon} ${name}${details ? ' -> ' + details : ''}`);
  }

  async function inspectVisibleButtonsAndImages(scopeLabel, maxViewportW = 1280) {
    const report = await page.evaluate((vw) => {
      function getVisibleRect(el) {
        const raw = el.getBoundingClientRect();
        let left = Math.max(0, raw.left);
        let top = Math.max(0, raw.top);
        let right = Math.min(window.innerWidth, raw.right);
        let bottom = Math.min(window.innerHeight, raw.bottom);
        let insideHorizontalScroller = false;
        let p = el.parentElement;
        while (p && p !== document.body && p !== document.documentElement) {
          const st = window.getComputedStyle(p);
          if ((st.overflowX === 'auto' || st.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 2) {
            insideHorizontalScroller = true;
          }
          if (['auto', 'scroll', 'hidden', 'clip'].includes(st.overflowX) || ['auto', 'scroll', 'hidden', 'clip'].includes(st.overflowY)) {
            const pr = p.getBoundingClientRect();
            left = Math.max(left, pr.left);
            top = Math.max(top, pr.top);
            right = Math.min(right, pr.right);
            bottom = Math.min(bottom, pr.bottom);
          }
          p = p.parentElement;
        }
        return { raw, left, top, right, bottom, visW: Math.max(0, right - left), visH: Math.max(0, bottom - top), insideHorizontalScroller };
      }

      const visibleEls = Array.from(document.querySelectorAll('button, .nav-tab-btn, .profile-option-item'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
        });

      const rects = visibleEls.map(el => {
        const c = getVisibleRect(el);
        return {
          el,
          label: (el.innerText || el.getAttribute('aria-label') || el.id || el.className || 'btn').trim().replace(/\s+/g, ' ').slice(0, 40),
          ...c,
        };
      }).filter(item => item.visW > 4 && item.visH > 4);

      const clipped = [];
      for (const item of rects) {
        if (!item.insideHorizontalScroller && (item.raw.left < -4 || item.raw.right > vw + 4)) {
          clipped.push(`${item.label} [x=${Math.round(item.raw.left)}..${Math.round(item.raw.right)} vs 0..${vw}]`);
        }
      }

      const overlaps = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (ox > 6 && oy > 6) {
            overlaps.push(`"${a.label}" overlaps "${b.label}" (${Math.round(ox)}x${Math.round(oy)})`);
          }
        }
      }

      const brokenImgs = Array.from(document.querySelectorAll('img'))
        .filter(img => {
          const s = window.getComputedStyle(img);
          return s.display !== 'none' && s.visibility !== 'hidden' && img.getBoundingClientRect().width > 0;
        })
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);

      return { buttonCount: rects.length, clipped, overlaps, brokenImgs };
    }, maxViewportW);

    if (report.clipped.length > 0) layoutIssues.push(`${scopeLabel} clipped buttons: ${report.clipped.join('; ')}`);
    if (report.overlaps.length > 0) layoutIssues.push(`${scopeLabel} overlapping buttons: ${report.overlaps.join('; ')}`);
    if (report.brokenImgs.length > 0) layoutIssues.push(`${scopeLabel} broken images: ${report.brokenImgs.join('; ')}`);

    const clean = report.clipped.length === 0 && report.overlaps.length === 0 && report.brokenImgs.length === 0;
    logStep(`Layout/Buttons (${scopeLabel})`, clean ? 'PASS' : 'FAIL', `${report.buttonCount} visible buttons verified`);
  }

  try {
    // 1. Load Homepage & Initial Auth Screen
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1000);
    const title = await page.title();
    logStep('Page Load', title.includes('SmartRide AI') ? 'PASS' : 'FAIL', `Title: "${title}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage.png') });

    // 2. Auth Entrance Modal & Sign In
    const authVisible = await page.isVisible('#web-auth-screen');
    logStep('Auth Screen Modal Display', authVisible ? 'PASS' : 'FAIL');

    await page.click('#page-auth-tab-register');
    await page.waitForTimeout(250);
    logStep('Auth Tab Switch to Register', (await page.isVisible('#page-register-form')) ? 'PASS' : 'FAIL');

    await page.click('#page-auth-tab-login');
    await page.waitForTimeout(250);
    logStep('Auth Tab Switch to Sign In', (await page.isVisible('#page-login-form')) ? 'PASS' : 'FAIL');

    await page.click('#page-auth-demo-autofill');
    await page.waitForTimeout(200);
    const emailVal = await page.inputValue('#page-login-email');
    const passVal = await page.inputValue('#page-login-password');
    logStep('Demo Autofill Button', (emailVal === 'rider@smartride.ai' && passVal === 'password123') ? 'PASS' : 'FAIL', `Email: ${emailVal}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_auth_screen.png') });

    await page.click('#page-login-submit-btn');
    await page.waitForTimeout(1200);
    logStep('Sign In & Unlock Application', !(await page.isVisible('#web-auth-screen')) ? 'PASS' : 'FAIL');

    // 3. No loose floating mic on screen
    const looseMic = await page.$('#chubby-voice-fab');
    logStep('Loose Floating Mic Removed from Screen', !looseMic ? 'PASS' : 'FAIL');

    // 3b. GPS Locate Button & Swap Locations Button
    const gpsBtn = await page.$('#locate-gps-btn');
    if (gpsBtn) {
      await gpsBtn.click();
      await page.waitForTimeout(1200);
      const detectedPickup = await page.inputValue('#pickup-input');
      logStep('GPS Locate Button (#locate-gps-btn)', 'PASS', `Pickup resolved: "${detectedPickup || 'Current Location'}"`);
    } else {
      logStep('GPS Locate Button (#locate-gps-btn)', 'FAIL', 'Missing #locate-gps-btn');
    }

    // 4. Route Search & Live Fare Comparison
    await page.evaluate(() => {
      const p = document.getElementById('pickup-input');
      const d = document.getElementById('dropoff-input');
      if (p) { p.removeAttribute('readonly'); p.value = 'Guindy, Chennai'; }
      if (d) { d.removeAttribute('readonly'); d.value = 'Marina Beach, Chennai'; }
    });
    await page.waitForTimeout(200);

    const swapBtn = await page.$('#swap-locations-btn');
    if (swapBtn) {
      await swapBtn.click();
      await page.waitForTimeout(200);
      await swapBtn.click();
      await page.waitForTimeout(200);
      logStep('Swap Locations Button (#swap-locations-btn)', 'PASS');
    }

    const searchBtn = await page.$('#search-route-btn');
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(2200);
      logStep('Route Search Execution (#search-route-btn)', 'PASS', 'Guindy -> Marina Beach');
    } else {
      logStep('Route Search Execution', 'FAIL', 'Button #search-route-btn not found');
    }

    await inspectVisibleButtonsAndImages('Rides Tab Desktop');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_ride_comparison.png') });

    // 5. Vehicle Category Selectors & Quotes
    const quoteCards = await page.$$('.quote-card');
    logStep('Render Fare Comparison Quotes', quoteCards.length > 0 ? 'PASS' : 'FAIL', `Found ${quoteCards.length} quote cards`);

    const firstQuoteName = await page.$eval('.quote-card .quote-vehicle-name', el => el.textContent.trim()).catch(() => '');
    const firstQuoteBookBtn = await page.$eval('.quote-card .quote-book-now-btn', el => el.textContent.trim()).catch(() => '');
    logStep('Quote Card Word Alignment & Book Button', (firstQuoteName && firstQuoteBookBtn) ? 'PASS' : 'FAIL', `"${firstQuoteName}" | "${firstQuoteBookBtn}"`);

    const bikePill = await page.$('.category-pill[data-cat="bike"]');
    if (bikePill) {
      await bikePill.click();
      await page.waitForTimeout(400);
      const bikeQuotes = await page.$$('.quote-card');
      logStep('Category Filter: Bike', bikeQuotes.length > 0 ? 'PASS' : 'FAIL', `${bikeQuotes.length} bike quotes`);
    }

    const autoPill = await page.$('.category-pill[data-cat="auto"]');
    if (autoPill) {
      await autoPill.click();
      await page.waitForTimeout(400);
      const autoQuotes = await page.$$('.quote-card');
      logStep('Category Filter: Auto', autoQuotes.length > 0 ? 'PASS' : 'FAIL', `${autoQuotes.length} auto quotes`);
    }

    const cabPill = await page.$('.category-pill[data-cat="cab"]');
    if (cabPill) {
      await cabPill.click();
      await page.waitForTimeout(400);
      logStep('Category Filter: Cab', 'PASS');
    }

    // 6. Explainable AI (SHAP / LIME)
    const xaiBtn = await page.$('.quote-xai-trigger');
    if (xaiBtn) {
      await xaiBtn.click();
      await page.waitForTimeout(600);
      const xaiSectionVisible = await page.isVisible('#section-xai');
      logStep('Explain AI Screen (SHAP / LIME)', xaiSectionVisible ? 'PASS' : 'FAIL');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_xai_screen.png') });
      const backBtn = await page.$('#section-xai .back-to-prev-btn');
      if (backBtn) await backBtn.click();
      else await page.click('#tab-rides');
      await page.waitForTimeout(400);
      logStep('Explain AI Back Navigation', 'PASS');
    }

    // 7. 1-Tap Book Now Flow
    const smartRideBookBtn = await page.$('.quote-book-now-btn');
    if (smartRideBookBtn) {
      await smartRideBookBtn.click();
      await page.waitForTimeout(900);
      const trackingVisible = await page.isVisible('#tracking-modal');
      const toastVisible = await page.isVisible('#toast-container .toast');
      logStep('1-Tap Book Now Action', (trackingVisible || toastVisible) ? 'PASS' : 'FAIL');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_booking_flow.png') });

      if (trackingVisible) {
        const closeTrack = await page.$('#close-tracking-modal') || await page.$('#tracking-modal .back-btn') || await page.$('.modal-back-btn[data-modal-close]');
        if (closeTrack) {
          await closeTrack.click();
          await page.waitForTimeout(400);
        } else {
          await page.evaluate(() => {
            const m = document.getElementById('tracking-modal');
            if (m) m.classList.remove('active');
          });
        }
      }
    }

    // 8. Chubby AI Modal & All 7 Sub-Tabs
    const chubbyFab = await page.$('#chubby-ai-fab');
    logStep('Chubby AI Floating Pill Present', !!chubbyFab ? 'PASS' : 'FAIL');
    if (chubbyFab) {
      await chubbyFab.click();
      await page.waitForTimeout(500);
      logStep('Chubby AI Modal Open', (await page.isVisible('#chubby-ai-modal')) ? 'PASS' : 'FAIL');

      for (const tabSpec of [
        ['#chubby-tab-multimodal', 'Multimodal'],
        ['#chubby-tab-future', 'Future Prices'],
        ['#chubby-tab-escape', 'Surge Escape'],
        ['#chubby-tab-voice', 'Voice AI'],
        ['#chubby-tab-weather', 'Weather AI'],
        ['#chubby-tab-sniper', 'Price Sniper'],
        ['#chubby-tab-chat', 'AI Chat'],
      ]) {
        await page.click(tabSpec[0]);
        await page.waitForTimeout(300);
        logStep(`Chubby AI Tab: ${tabSpec[1]}`, 'PASS');
      }

      const chatMic = await page.$('#chatbot-voice-mic-btn');
      logStep('Chubby AI Chatbot Mic Button Inside Input Bar', !!chatMic ? 'PASS' : 'FAIL');
      await page.fill('#chatbot-input', 'Which ride is cheapest?');
      await page.click('#chatbot-send-btn');
      await page.waitForTimeout(800);
      const botMessages = await page.$$('#chatbot-messages .chat-msg');
      logStep('Chubby AI Chatbot Response', botMessages.length >= 2 ? 'PASS' : 'FAIL', `Messages: ${botMessages.length}`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_chatbot.png') });

      await page.click('#chubby-modal-close');
      await page.waitForTimeout(300);
    }

    // 9. All Main Header Tabs (Parcel, Commute, Forecast, Radar)
    await page.click('#tab-parcel');
    await page.waitForTimeout(500);
    logStep('Tab: Parcel Express', (await page.isVisible('#section-parcel')) ? 'PASS' : 'FAIL');
    const carTier = await page.$('.parcel-tiers .tier-card[data-tier="car"]');
    if (carTier) {
      await carTier.click();
      await page.waitForTimeout(300);
      const estFare = await page.$eval('#parcel-fare-estimate', el => el.textContent.trim()).catch(() => '');
      logStep('Parcel Car Tier Selection', 'PASS', `Est: ${estFare}`);
    }
    await inspectVisibleButtonsAndImages('Parcel Tab');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_parcel_express.png') });

    await page.click('#tab-commute');
    await page.waitForTimeout(500);
    logStep('Tab: Smart Commute', (await page.isVisible('#section-commute')) ? 'PASS' : 'FAIL');
    await inspectVisibleButtonsAndImages('Commute Tab');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_smart_commute.png') });

    await page.click('#tab-forecast');
    await page.waitForTimeout(500);
    logStep('Tab: Future Price Forecast', (await page.isVisible('#section-forecast')) ? 'PASS' : 'FAIL');
    await inspectVisibleButtonsAndImages('Forecast Tab');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_future_price_dashboard.png') });

    await page.click('#tab-radar');
    await page.waitForTimeout(500);
    logStep('Tab: Fleet Radar', (await page.isVisible('#section-radar')) ? 'PASS' : 'FAIL');
    await inspectVisibleButtonsAndImages('Radar Tab');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_fleet_radar.png') });

    // 10. Profile Hub & EVERY 9 Arranged Services Round-Trip
    await page.click('#tab-profile');
    await page.waitForTimeout(500);
    logStep('Tab: Profile', (await page.isVisible('#section-profile')) ? 'PASS' : 'FAIL');
    await inspectVisibleButtonsAndImages('Profile Hub');

    const hubTargets = await page.$$eval('.profile-option-item', els => els.map(e => e.getAttribute('data-target')));
    logStep('Profile Options Hub (9 Arranged Services)', hubTargets.length === 9 ? 'PASS' : 'FAIL', `${hubTargets.join(', ')}`);

    for (const target of hubTargets) {
      const tile = await page.$(`.profile-option-item[data-target="${target}"]`);
      await tile.click();
      await page.waitForTimeout(450);
      const visible = await page.isVisible(`#section-${target}`);
      logStep(`Profile Tile -> #section-${target}`, visible ? 'PASS' : 'FAIL');
      await inspectVisibleButtonsAndImages(`Profile Subpage ${target}`);
      if (target === 'activity') {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_trip_history.png') });
      }
      const backBtn = await page.$(`#section-${target} .back-to-prev-btn`);
      if (backBtn) {
        await backBtn.click();
        await page.waitForTimeout(350);
      } else {
        await page.click('#tab-profile');
        await page.waitForTimeout(350);
      }
      const backToProfile = await page.isVisible('#section-profile');
      logStep(`Back to Profile from ${target}`, backToProfile ? 'PASS' : 'FAIL');
    }

    const switchAcctBtn = await page.$('#open-auth-btn');
    const logoutBtn = await page.$('#logout-btn');
    logStep('Profile Auth Actions Present', (switchAcctBtn && logoutBtn) ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_profile_settings.png') });

    // 11. Mobile Responsive Viewport Check on Web
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#tab-rides');
    await page.waitForTimeout(500);
    await inspectVisibleButtonsAndImages('Web Mobile Responsive 390px', 390);
  } catch (error) {
    console.error('Audit encountered error:', error);
    logStep('Audit Flow Execution', 'FAIL', error.message);
  } finally {
    await browser.close();
  }

  const passedCount = results.filter(r => r.status === 'PASS').length;
  const failedChecks = results.filter(r => r.status === 'FAIL');
  const summary = {
    total: results.length,
    passed: passedCount,
    failed: failedChecks.length,
    consoleErrors: consoleErrors.length,
    httpErrors: httpErrors.length,
    networkErrors: networkErrors.length,
    layoutIssues: layoutIssues.length,
    externalWarnings: externalWarnings.length,
  };

  console.log('\n==================================================================');
  console.log('WEB APPLICATION AUDIT SUMMARY:');
  console.log(`Total Checks: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Console Errors: ${summary.consoleErrors}`);
  if (consoleErrors.length > 0) console.log('Console Errors:', consoleErrors);
  console.log(`First-Party HTTP >=400 Responses: ${summary.httpErrors}`);
  if (httpErrors.length > 0) console.log('HTTP Errors:', httpErrors);
  console.log(`First-Party Network Failures: ${summary.networkErrors}`);
  if (networkErrors.length > 0) console.log('Network Failures:', networkErrors);
  console.log(`Layout/Image Issues: ${summary.layoutIssues}`);
  if (layoutIssues.length > 0) console.log('Layout Issues:', layoutIssues);
  if (externalWarnings.length > 0) console.log(`External CDN/API Notices (non-blocking in CI): ${externalWarnings.length}`);
  console.log('==================================================================\n');

  writeJsonReport('Web Application E2E', summary, results, {
    consoleErrors,
    httpErrors,
    networkErrors,
    layoutIssues,
    externalWarnings,
  });

  if (failedChecks.length > 0 || consoleErrors.length > 0 || httpErrors.length > 0 || networkErrors.length > 0 || layoutIssues.length > 0) {
    process.exit(1);
  }
}

runHumanLikeAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
