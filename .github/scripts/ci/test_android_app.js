/**
 * Comprehensive Android Application Full-Route, UI Placement & Element Audit
 * Cross-platform Playwright + Mobile Android Viewport Simulation (Pixel 8: 412x915)
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

const BASE_URL = process.env.SMARTRIDE_MOBILE_URL || process.env.MOBILE_URL || 'http://localhost:5173/';
const CHROME_PATH = resolveChromeExecutable();
const SCREENSHOT_DIR = ensureScreenshotDir('android');
const VIEWPORT = { width: 412, height: 915 };
const IS_CI = process.env.CI === 'true' && process.env.STRICT_EXTERNAL_HTTP !== '1';

async function runAndroidAppAudit() {
  console.log(`Starting Android App Full-Route & Button Placement Audit on ${BASE_URL} (Chrome: ${CHROME_PATH || 'playwright-bundled'})...\n`);

  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
  };
  if (CHROME_PATH) {
    launchOpts.executablePath = CHROME_PATH;
  }

  const browser = await chromium.launch(launchOpts);

  const results = [];
  const buttonChecks = [];
  const consoleErrors = [];
  const httpErrors = [];
  const networkErrors = [];
  const layoutViolations = [];
  const externalWarnings = [];

  function attachListeners(page, routeTracker) {
    page.on('pageerror', err => {
      consoleErrors.push(`[${routeTracker.current}] pageerror: ${err.message}`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (txt.includes('favicon.ico')) return;
        if (IS_CI && txt.includes('Failed to load resource') && (txt.includes('429') || txt.includes('403') || txt.includes('status of 5'))) {
          externalWarnings.push(`[${routeTracker.current}] Console notice: ${txt}`);
          return;
        }
        consoleErrors.push(`[${routeTracker.current}] ${txt}`);
      }
    });
    page.on('response', res => {
      const url = res.url();
      if (res.status() >= 400 && !url.includes('favicon.ico')) {
        if (!isFirstPartyUrl(url) && IS_CI) {
          externalWarnings.push(`[${routeTracker.current}] External HTTP ${res.status()} ${url}`);
        } else {
          httpErrors.push(`[${routeTracker.current}] ${res.status()} ${url}`);
        }
      }
    });
    page.on('requestfailed', req => {
      const url = req.url();
      const errText = req.failure()?.errorText || '';
      if (errText === 'net::ERR_ABORTED' && (url.includes('maps.googleapis.com') || url.includes('localhost:5173') || url.includes('127.0.0.1:5173') || url.includes('api.open-meteo.com'))) {
        return;
      }
      if (!url.includes('favicon.ico')) {
        if (!isFirstPartyUrl(url) && IS_CI) {
          externalWarnings.push(`[${routeTracker.current}] External failed: ${req.method()} ${url} -> ${errText}`);
        } else {
          networkErrors.push(`[${routeTracker.current}] ${req.method()} ${url} -> ${errText}`);
        }
      }
    });
  }

  function logStep(name, status, details = '') {
    const icon = status === 'PASS' ? '[PASS]' : status === 'WARN' ? '[WARN]' : '[FAIL]';
    results.push({ suite: 'Android App Mobile E2E', name, status, details });
    console.log(`${icon} ${name}${details ? ' -> ' + details : ''}`);
  }

  async function checkButton(page, locatorOrSelector, description, options = {}) {
    const { expectedMaxBottom = VIEWPORT.height, scrollIntoView = false } = options;
    try {
      const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;
      const count = await loc.count();
      if (count === 0) {
        buttonChecks.push({ suite: 'Android Button Check', name: description, status: 'FAIL', details: 'Element not found' });
        console.log(`[BTN FAIL] ${description}: Not found`);
        return false;
      }
      if (scrollIntoView) {
        await loc.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(150);
      }
      if (!(await loc.isVisible())) {
        buttonChecks.push({ suite: 'Android Button Check', name: description, status: 'FAIL', details: 'Element hidden' });
        console.log(`[BTN FAIL] ${description}: Hidden`);
        return false;
      }
      const box = await loc.boundingBox();
      if (!box) {
        buttonChecks.push({ suite: 'Android Button Check', name: description, status: 'FAIL', details: 'No bounding box' });
        return false;
      }
      const passed = box.width >= 20 && box.height >= 20 && box.y >= -5 && (box.y + box.height) <= (expectedMaxBottom + 15);
      const details = `Box: [x:${Math.round(box.x)}, y:${Math.round(box.y)}, w:${Math.round(box.width)}, h:${Math.round(box.height)}]`;
      buttonChecks.push({ suite: 'Android Button Check', name: description, status: passed ? 'PASS' : 'FAIL', details });
      console.log(`${passed ? '[BTN PASS]' : '[BTN FAIL]'} ${description} -> ${details}`);
      return passed;
    } catch (err) {
      buttonChecks.push({ suite: 'Android Button Check', name: description, status: 'FAIL', details: err.message });
      return false;
    }
  }

  async function auditScreenLayout(page, routeLabel, screenshotFile = null) {
    await page.waitForTimeout(900);
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
        const s = window.getComputedStyle(img);
        return s.display !== 'none' && s.visibility !== 'hidden' && img.getBoundingClientRect().width > 0;
      });
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => {
          const t = setTimeout(resolve, 4000);
          img.addEventListener('load', () => { clearTimeout(t); resolve(); }, { once: true });
          img.addEventListener('error', () => { clearTimeout(t); setTimeout(resolve, 150); }, { once: true });
        });
      }));
    });
    if (screenshotFile) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshotFile) });
    }

    const audit = await page.evaluate((vw) => {
      const text = document.body?.innerText || '';
      const hasErrorBoundary = text.includes('The application encountered a display issue') || text.includes('Something went wrong');

      function getVisibleClippedRect(el) {
        const r = el.getBoundingClientRect();
        let left = Math.max(0, r.left);
        let top = Math.max(0, r.top);
        let right = Math.min(window.innerWidth, r.right);
        let bottom = Math.min(window.innerHeight, r.bottom);
        let insideHorizontalScroller = false;

        let p = el.parentElement;
        while (p && p !== document.body && p !== document.documentElement) {
          const st = window.getComputedStyle(p);
          const ox = st.overflowX;
          const oy = st.overflowY;
          if (ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll' || ox === 'hidden' || oy === 'hidden' || ox === 'clip' || oy === 'clip') {
            if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth + 2) {
              insideHorizontalScroller = true;
            }
            const pr = p.getBoundingClientRect();
            left = Math.max(left, pr.left);
            top = Math.max(top, pr.top);
            right = Math.min(right, pr.right);
            bottom = Math.min(bottom, pr.bottom);
          }
          p = p.parentElement;
        }
        return {
          raw: r,
          left,
          top,
          right,
          bottom,
          visW: Math.max(0, right - left),
          visH: Math.max(0, bottom - top),
          insideHorizontalScroller,
        };
      }

      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
        .filter(el => {
          const s = window.getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
          const r = el.getBoundingClientRect();
          return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < window.innerHeight;
        });

      const rects = buttons
        .map(el => {
          const c = getVisibleClippedRect(el);
          return {
            el,
            label: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || 'btn').trim().replace(/\s+/g, ' ').slice(0, 36),
            ...c,
          };
        })
        .filter(item => item.visW > 4 && item.visH > 4);

      const clippedX = [];
      for (const item of rects) {
        if (!item.insideHorizontalScroller && (item.raw.left < -6 || item.raw.right > vw + 6)) {
          clippedX.push(`${item.label} [${Math.round(item.raw.left)}..${Math.round(item.raw.right)}]`);
        }
      }

      const overlaps = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          if (Boolean(a.el.closest('.gm-style')) !== Boolean(b.el.closest('.gm-style'))) continue;
          const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (ox > 8 && oy > 8) {
            overlaps.push(`"${a.label}" overlaps "${b.label}" (${Math.round(ox)}x${Math.round(oy)})`);
          }
        }
      }

      const brokenImgs = Array.from(document.querySelectorAll('img'))
        .filter(img => {
          const s = window.getComputedStyle(img);
          const r = img.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
        })
        .filter(img => img.naturalWidth === 0)
        .map(img => img.src);

      return {
        hasErrorBoundary,
        nonEmptyRender: text.trim().length > 10,
        buttonCount: rects.length,
        clippedX,
        overlaps,
        brokenImgs,
      };
    }, VIEWPORT.width);

    if (audit.hasErrorBoundary) layoutViolations.push(`${routeLabel}: React ErrorBoundary displayed`);
    if (!audit.nonEmptyRender) layoutViolations.push(`${routeLabel}: Blank screen rendered`);
    if (audit.clippedX.length > 0) layoutViolations.push(`${routeLabel}: Horizontal button clipping -> ${audit.clippedX.join('; ')}`);
    if (audit.overlaps.length > 0) layoutViolations.push(`${routeLabel}: Overlapping interactive buttons -> ${audit.overlaps.join('; ')}`);
    if (audit.brokenImgs.length > 0) layoutViolations.push(`${routeLabel}: Broken images -> ${audit.brokenImgs.join('; ')}`);

    const ok = !audit.hasErrorBoundary && audit.nonEmptyRender && audit.clippedX.length === 0 && audit.overlaps.length === 0 && audit.brokenImgs.length === 0;
    logStep(`Route ${routeLabel}`, ok ? 'PASS' : 'FAIL', `${audit.buttonCount} visible buttons, clean images & layers`);
    return audit;
  }

  try {
    console.log('--- PHASE 1: UNAUTHENTICATED AUTH & LEGAL ROUTES ---');
    const authCtx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      permissions: ['geolocation'],
      geolocation: { latitude: 13.0827, longitude: 80.2707 },
    });
    const authPage = await authCtx.newPage();
    const authRouteTracker = { current: '#/splash' };
    attachListeners(authPage, authRouteTracker);

    for (const route of ['#/splash', '#/onboarding', '#/login', '#/signup', '#/terms', '#/privacy']) {
      authRouteTracker.current = route;
      await authPage.goto(`${BASE_URL}${route}`, { waitUntil: route === '#/splash' ? 'networkidle' : 'domcontentloaded', timeout: 20000 });
      await auditScreenLayout(authPage, route);
    }
    await authCtx.close();

    console.log('\n--- PHASE 2: AUTHENTICATED PIXEL 8 MOBILE APP ROUTES ---');
    const appCtx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      permissions: ['geolocation'],
      geolocation: { latitude: 13.0827, longitude: 80.2707 },
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 SmartRideAndroid/3.5',
    });
    const page = await appCtx.newPage();
    const routeTracker = { current: '#/user/home' };
    attachListeners(page, routeTracker);

    await page.addInitScript(() => {
      localStorage.setItem('smartride_token', 'demo_token_12345');
      localStorage.setItem('smartride_user', JSON.stringify({
        id: 1,
        name: 'Rider Demo',
        email: 'rider@smartride.ai',
        phone: '+91 98765 43210',
        role: 'rider',
      }));
      localStorage.setItem('smartride_user_pickup', 'Guindy, Chennai');
      localStorage.setItem('smartride_user_dropoff', 'Marina Beach, Chennai');
      localStorage.setItem('smartride_view_mode', 'mobile');
      localStorage.setItem('app-theme', 'dark-ai');
    });

    routeTracker.current = '#/user/welcome';
    await page.goto(`${BASE_URL}#/user/welcome`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/welcome');

    routeTracker.current = '#/user/home';
    await page.goto(`${BASE_URL}#/user/home`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);
    await auditScreenLayout(page, '#/user/home', '01_home_screen.png');
    await checkButton(page, '[aria-label="Current Location"], [aria-label*="Location"], div:has-text("Guindy"), div:has-text("Current")', 'Home: Top Location Pill');
    await checkButton(page, '[role="button"]:has-text("Where do you want to go?")', 'Home: Where To Search Trigger');
    await checkButton(page, '[aria-label="Open Chubby AI Assistant"]', 'Home: Floating Chubby AI Button');
    for (const tab of ['Home', 'Commute', 'Parcel', 'Activity', 'Profile']) {
      const tabLocator = page.locator(`button:has-text("${tab}"), [role="button"]:has-text("${tab}"), a:has-text("${tab}")`).last();
      await checkButton(page, tabLocator, `Home Bottom Nav: ${tab}`);
    }

    routeTracker.current = '#/user/search';
    await page.goto(`${BASE_URL}#/user/search`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/search');

    routeTracker.current = '#/user/map-picker';
    await page.goto(`${BASE_URL}#/user/map-picker?mode=pickup`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);
    await auditScreenLayout(page, '#/user/map-picker', '02_map_picker_screen.png');
    await checkButton(page, 'button:has(svg.lucide-arrow-left), button[title*="Back"], [aria-label*="Back"]', 'Map Picker: Top Back Button');
    await checkButton(page, 'button:has-text("Set as Current Location"), button:has-text("Confirm")', 'Map Picker: Confirm CTA');

    routeTracker.current = '#/user/ride-comparison';
    await page.goto(`${BASE_URL}#/user/ride-comparison`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1000);
    await auditScreenLayout(page, '#/user/ride-comparison', '03_ride_comparison_screen.png');
    await checkButton(page, 'button:has-text("Cab (4-Seater)"), button:has-text("All Rides")', 'Ride Comparison: Category Pill');
    await checkButton(page, 'button:has-text("Book Now"), button:has-text("Book")', 'Ride Comparison: Book CTA');
    await checkButton(page, 'button[aria-label="Open Chubby AI Assistant"]', 'Ride Comparison: Header Chubby AI Button');

    const chubbyTrigger = page.locator('button[aria-label="Open Chubby AI Assistant"]').last();
    if ((await chubbyTrigger.count()) > 0) {
      await chubbyTrigger.click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_chubby_ai_modal.png') });
      await checkButton(page, 'button:has(svg.lucide-x), [aria-label*="Close"]', 'Chubby AI Modal: Close Button');
      const aiChatTab = page.locator('button:has-text("AI Chat")').first();
      await checkButton(page, aiChatTab, 'Chubby AI Modal: AI Chat Sub-Tab');
      if ((await aiChatTab.count()) > 0) {
        await aiChatTab.click();
        await page.waitForTimeout(500);
        await checkButton(page, 'input[placeholder*="Ask Chubby AI"]', 'Chubby AI Chat: Input Bar');
        await checkButton(page, 'button:has(svg.lucide-mic), [aria-label*="Mic"]', 'Chubby AI Chat: Mic Button');
        await checkButton(page, 'button:has(svg.lucide-send), [aria-label*="Send"]', 'Chubby AI Chat: Send Button');
      }
      const closeBtn = page.locator('button:has(svg.lucide-x), [aria-label*="Close"]').first();
      if ((await closeBtn.count()) > 0) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    routeTracker.current = '#/user/ai-insights';
    await page.goto(`${BASE_URL}#/user/ai-insights`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/ai-insights');

    routeTracker.current = '#/user/profile';
    await page.goto(`${BASE_URL}#/user/profile`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/profile', '05_profile_screen.png');
    for (const opt of ['My Rides', 'Explainable AI', 'Saved Places', 'Famous Places', 'Emergency', 'Refer', 'Ratings', 'Settings', 'Help']) {
      await checkButton(page, page.locator(`div:has-text("${opt}")`).last(), `Profile Tile: ${opt}`, { scrollIntoView: true });
    }

    routeTracker.current = '#/user/emergency';
    await page.goto(`${BASE_URL}#/user/emergency`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/emergency', '08_emergency_screen.png');

    routeTracker.current = '#/user/theme';
    await page.goto(`${BASE_URL}#/user/theme`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/theme', '10_theme_settings_screen.png');

    for (const r of [
      ['#/user/invite', null],
      ['#/user/safety', null],
      ['#/user/parcel', '07_parcel_screen.png'],
      ['#/user/saved-places', null],
    ]) {
      routeTracker.current = r[0];
      await page.goto(`${BASE_URL}${r[0]}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await auditScreenLayout(page, r[0], r[1]);
    }

    routeTracker.current = '#/user/famous-places';
    await page.goto(`${BASE_URL}#/user/famous-places`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1200);
    await auditScreenLayout(page, '#/user/famous-places', '09_famous_places_screen.png');

    for (const r of ['#/user/settings', '#/user/performance', '#/user/help', '#/user/reviews', '#/user/activity', '#/user/my-rides']) {
      routeTracker.current = r;
      await page.goto(`${BASE_URL}${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await auditScreenLayout(page, r);
    }

    routeTracker.current = '#/user/commute';
    await page.goto(`${BASE_URL}#/user/commute`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await auditScreenLayout(page, '#/user/commute', '06_commute_dashboard.png');
    const overlappingFabPresent = await page.locator('button[aria-label="Create Commute Profile"]').count();
    logStep('CommuteDashboard Fixed Overlapping + FAB Removed', overlappingFabPresent === 0 ? 'PASS' : 'FAIL');

    for (const r of [
      '#/user/commute/create-profile',
      '#/user/commute/results',
      '#/user/commute/compatibility',
      '#/user/commute/chat',
      '#/user/commute/safety',
      '#/user/commute/savings',
    ]) {
      routeTracker.current = r;
      await page.goto(`${BASE_URL}${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await auditScreenLayout(page, r);
    }

    await appCtx.close();
  } catch (error) {
    console.error('Audit encountered error:', error);
    logStep('Audit Flow Execution', 'FAIL', error.message);
  } finally {
    await browser.close();
  }

  const failedSteps = results.filter(r => r.status === 'FAIL');
  const failedButtons = buttonChecks.filter(b => b.status === 'FAIL');
  const combinedRecords = [...results, ...buttonChecks];
  const summary = {
    routesTotal: results.length,
    routesPassed: results.filter(r => r.status === 'PASS').length,
    routesFailed: failedSteps.length,
    buttonsTotal: buttonChecks.length,
    buttonsPassed: buttonChecks.filter(b => b.status === 'PASS').length,
    buttonsFailed: failedButtons.length,
    total: combinedRecords.length,
    passed: combinedRecords.filter(r => r.status === 'PASS').length,
    failed: failedSteps.length + failedButtons.length,
    layoutViolations: layoutViolations.length,
    consoleErrors: consoleErrors.length,
    httpErrors: httpErrors.length,
    networkErrors: networkErrors.length,
    externalWarnings: externalWarnings.length,
  };

  console.log('\n==================================================================');
  console.log('ANDROID APPLICATION FULL-ROUTE & BUTTON PLACEMENT SUMMARY:');
  console.log(`Total Route & Flow Checks: ${summary.routesTotal}`);
  console.log(`Passed Routes: ${summary.routesPassed}`);
  console.log(`Failed Routes: ${summary.routesFailed}`);
  console.log(`Key Button Spot-Checks: ${summary.buttonsTotal} (Passed: ${summary.buttonsPassed}, Failed: ${summary.buttonsFailed})`);
  console.log(`Layout / Layer / Image Violations: ${summary.layoutViolations}`);
  if (layoutViolations.length > 0) console.log('Violations:', layoutViolations);
  console.log(`Console Errors: ${summary.consoleErrors}`);
  if (consoleErrors.length > 0) console.log('Console Errors:', consoleErrors);
  console.log(`First-Party HTTP >=400 Responses: ${summary.httpErrors}`);
  if (httpErrors.length > 0) console.log('HTTP Errors:', httpErrors);
  console.log(`First-Party Network Failures: ${summary.networkErrors}`);
  if (networkErrors.length > 0) console.log('Network Failures:', networkErrors);
  if (externalWarnings.length > 0) console.log(`External CDN/API Notices (non-blocking in CI): ${externalWarnings.length}`);
  console.log('==================================================================\n');

  writeJsonReport('Android App Mobile E2E', summary, combinedRecords, {
    layoutViolations,
    consoleErrors,
    httpErrors,
    networkErrors,
    externalWarnings,
  });

  if (
    failedSteps.length > 0 ||
    failedButtons.length > 0 ||
    layoutViolations.length > 0 ||
    consoleErrors.length > 0 ||
    httpErrors.length > 0 ||
    networkErrors.length > 0
  ) {
    process.exit(1);
  }
}

runAndroidAppAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
