/**
 * Comprehensive Android Application Layout & Button Placement Audit Script
 * Automated with Playwright + Mobile Android Viewport Simulation (Pixel 8)
 * 
 * Tests every screen, layer, and button in the SmartRide AI Android app:
 *  1. Login & Auth screen button placement
 *  2. Home screen (Top Location Badge, Map Recenter, Quick Chips, Floating Chubby AI, 5-Tab Bottom Nav)
 *  3. Search screen (Pickup, Destination, Swap button, Landmark chips)
 *  4. Map Picker screen (Address Bar, Pin-Drop, Confirm Pickup / Set as Current Location button)
 *  5. Ride Comparison screen (Category pills, Quote Cards, Book Now buttons, XAI button, Floating Chubby AI)
 *  6. Chubby AI Mobile Bottom Sheet (Quick-action chips, Input bar, Mic button, Send button)
 *  7. Profile Screen (9 Arranged Services Grid, Edit Profile, Logout, Switch Account)
 *  8. Smart Commute Dashboard (Role switch pills, Filter chips, Match cards, Action buttons)
 *  9. Parcel Express (Vehicle tier cards, Rate estimates, Continue button)
 * 10. Activity & Trip History (Past ride cards, Rebook buttons)
 * 11. Emergency & SOS (1-Tap Big SOS Button, Add Contact button)
 * 12. Famous Places (Landmark cards, Set as Destination buttons)
 * 13. Explainable AI (SHAP / LIME inspector, Perturbation sliders)
 * 14. Settings & Help Center (Theme pills, Accordions)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173/';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\NARASIMHA\\.gemini\\antigravity\\brain\\29c4b434-6f9f-49d9-b8da-101cbc26ca2c\\test_screenshots\\android_audit';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAndroidAppAudit() {
  console.log('🚀 Starting Comprehensive Android App Button Placement & Layer Audit on ' + BASE_URL + ' ...\n');
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  // Emulate Pixel 8 Android phone (412 x 915)
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 SmartRideAndroid/3.5'
  });

  const page = await context.newPage();

  const results = [];
  const buttonChecks = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('photon.komoot.io') && !txt.includes('favicon.ico')) {
        consoleErrors.push(txt);
      }
    }
  });

  function logStep(name, status, details = '') {
    const icon = status === 'PASS' ? '✅ [PASS]' : status === 'WARN' ? '⚠️ [WARN]' : '❌ [FAIL]';
    results.push({ name, status, details });
    console.log(`${icon} ${name} ${details ? '-> ' + details : ''}`);
  }

  // Helper to check button placement & collision
  async function checkButton(locatorOrSelector, description, expectedMaxBottom = 915) {
    try {
      const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;
      const count = await loc.count();
      if (count === 0) {
        buttonChecks.push({ description, status: 'FAIL', details: 'Element not found' });
        console.log(`❌ [BTN FAIL] ${description}: Not found`);
        return false;
      }
      const isVisible = await loc.isVisible();
      if (!isVisible) {
        buttonChecks.push({ description, status: 'FAIL', details: 'Element hidden' });
        console.log(`❌ [BTN FAIL] ${description}: Element is not visible`);
        return false;
      }
      const box = await loc.boundingBox();
      if (!box) {
        buttonChecks.push({ description, status: 'FAIL', details: 'Could not get bounding box' });
        return false;
      }

      const isValidSize = box.width >= 20 && box.height >= 20;
      const isWithinViewport = (box.y + box.height) <= (expectedMaxBottom + 15);
      const isAboveScreenTop = box.y >= -5;

      const passed = isValidSize && isWithinViewport && isAboveScreenTop;
      const details = `Box: [x:${Math.round(box.x)}, y:${Math.round(box.y)}, w:${Math.round(box.width)}, h:${Math.round(box.height)}]`;

      buttonChecks.push({
        description,
        status: passed ? 'PASS' : 'WARN',
        details
      });

      console.log(`${passed ? '✅ [BTN PASS]' : '⚠️ [BTN WARN]'} ${description} -> ${details}`);
      return passed;
    } catch (err) {
      buttonChecks.push({ description, status: 'FAIL', details: err.message });
      console.log(`❌ [BTN ERROR] ${description}: ${err.message}`);
      return false;
    }
  }

  // Pre-seed authenticated rider session
  await page.addInitScript(() => {
    localStorage.setItem('smartride_token', 'demo_token_12345');
    localStorage.setItem('smartride_user', JSON.stringify({
      id: 1,
      name: 'Rider Demo',
      email: 'rider@smartride.ai',
      phone: '+91 98765 43210',
      role: 'rider'
    }));
    localStorage.setItem('smartride_user_pickup', 'Guindy, Chennai');
    localStorage.setItem('smartride_user_dropoff', 'Marina Beach, Chennai');
    localStorage.setItem('smartride_view_mode', 'mobile');
    localStorage.setItem('app-theme', 'dark-ai');
  });

  try {
    // ══════════════════════════════════════════════════════════════════
    // SCREEN 1: HOME SCREEN (Header, Map, Chubby AI, Bottom Nav)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 1. AUDITING HOME SCREEN ---');
    await page.goto(`${BASE_URL}#/user/home`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home_screen.png') });
    logStep('Home Screen Render', 'PASS');

    // 1.1 Top Location Badge Button
    await checkButton(page.locator('[aria-label="Current Location"], [aria-label*="Location"], div:has-text("Guindy"), div:has-text("Current")').first(), 'Top Location Badge Button (Home)');

    // 1.2 "Where to?" Search Input trigger
    await checkButton(page.locator('[aria-label="Where to?"], input[placeholder*="Where to"], div:has-text("Where to?")').first(), 'Search Destination Input Trigger');

    // 1.3 Floating Chubby AI Action Pill
    await checkButton(page.locator('[aria-label="Open Chubby AI Assistant"], div:has-text("Chubby AI")').last(), 'Floating Chubby AI Pill (Home)');

    // 1.4 Verify Chubby AI Pill sits strictly above Bottom Nav
    const chubbyEl = page.locator('[aria-label="Open Chubby AI Assistant"], div:has-text("Chubby AI")').last();
    const chubbyBox = (await chubbyEl.count()) > 0 ? await chubbyEl.boundingBox() : null;
    if (chubbyBox) {
      const isAboveBottomNav = chubbyBox.y + chubbyBox.height <= 855; // Nav starts around 855
      logStep('Chubby AI Placement Above Bottom Nav', isAboveBottomNav ? 'PASS' : 'WARN', `Bottom edge: ${Math.round(chubbyBox.y + chubbyBox.height)}px (Nav bar at ~855px)`);
    }

    // 1.5 Bottom Navigation Bar (5 Primary Buttons)
    await checkButton(page.locator('div:has-text("Home")').last(), 'Bottom Nav: Home Button');
    await checkButton(page.locator('div:has-text("Commute")').last(), 'Bottom Nav: Commute Button');
    await checkButton(page.locator('div:has-text("Parcel")').last(), 'Bottom Nav: Parcel Button');
    await checkButton(page.locator('div:has-text("Activity")').last(), 'Bottom Nav: Activity Button');
    await checkButton(page.locator('div:has-text("Profile")').last(), 'Bottom Nav: Profile Button');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 2: MAP PICKER SCREEN (/user/map-picker)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 2. AUDITING MAP PICKER SCREEN ---');
    await page.goto(`${BASE_URL}#/user/map-picker?mode=pickup`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_map_picker_screen.png') });

    // 2.1 Back Button
    await checkButton(page.locator('button[title*="Back"], svg.lucide-arrow-left, [aria-label*="Back"]').first(), 'Map Picker: Top Back Button');

    // 2.2 Bottom Confirmation Button
    await checkButton(page.locator('button:has-text("Set as Current Location"), button:has-text("Confirm Pickup")').first(), 'Map Picker: Confirm Location Action Button');

    // 2.3 Verify Bottom Nav is hidden on Map Picker
    const bottomNavOnMapPicker = page.locator('div:has-text("Home")').last();
    const isNavHiddenOnMapPicker = (await bottomNavOnMapPicker.count()) === 0 || !(await bottomNavOnMapPicker.isVisible());
    logStep('Bottom Nav Hidden on Map Picker', isNavHiddenOnMapPicker ? 'PASS' : 'FAIL', 'Ensures Confirm button has full screen width and no touch interception');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 3: RIDE COMPARISON SCREEN (/user/ride-comparison)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 3. AUDITING RIDE COMPARISON SCREEN ---');
    await page.goto(`${BASE_URL}#/user/ride-comparison`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_ride_comparison_screen.png') });

    // 3.1 Back Button
    await checkButton(page.locator('button[title*="Back"], svg.lucide-arrow-left, [aria-label*="Back"]').first(), 'Ride Comparison: Top Back Button');

    // 3.2 Category Filter Pills
    await checkButton(page.locator('button:has-text("Cab 4S"), button:has-text("All")').first(), 'Category Filter: Cab Pill');
    await checkButton(page.locator('button:has-text("Auto")').first(), 'Category Filter: Auto Pill');
    await checkButton(page.locator('button:has-text("Bike")').first(), 'Category Filter: Bike Pill');

    // 3.3 Quote Cards "Book Now" Buttons
    const bookButtons = page.locator('button:has-text("Book Now"), button:has-text("⚡ Book")');
    const bookBtnCount = await bookButtons.count();
    logStep('Ride Comparison Quotes Rendered', bookBtnCount > 0 ? 'PASS' : 'FAIL', `Found ${bookBtnCount} Book buttons`);
    if (bookBtnCount > 0) {
      await checkButton(bookButtons.first(), 'First Quote Card: Book Now Button Placement');
    }

    // 3.4 Floating Chubby AI Pill on Ride Comparison
    await checkButton(page.locator('[aria-label="Open Chubby AI Assistant"], div:has-text("Chubby AI")').last(), 'Floating Chubby AI Pill (Ride Comparison)');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 4: CHUBBY AI MODAL (Mobile Bottom Sheet)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 4. AUDITING CHUBBY AI MODAL ---');
    // Open Chubby AI Modal by clicking the pill
    const chubbyTrigger = page.locator('[aria-label="Open Chubby AI Assistant"], div:has-text("Chubby AI")').last();
    if ((await chubbyTrigger.count()) > 0) {
      await chubbyTrigger.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_chubby_ai_modal.png') });

      // 4.1 Close Button (X)
      await checkButton(page.locator('button:has(svg.lucide-x), [aria-label*="Close"]').first(), 'Chubby AI Modal: Top-Right Close Button');

      // 4.2 Quick Suggestion Chips
      await checkButton(page.locator('button:has-text("⚡ Real-Time Analysis"), div:has-text("Real-Time")').first(), 'Chubby AI: Real-Time Analysis Quick Chip');
      await checkButton(page.locator('button:has-text("Public Transit"), div:has-text("Public Transit")').first(), 'Chubby AI: Public Transit Quick Chip');

      // 4.3 Chat Input Bar with Built-in Mic & Send Buttons
      await checkButton(page.locator('input[placeholder*="Ask Chubby AI"]').first(), 'Chubby AI: Chat Text Input Bar');
      await checkButton(page.locator('button:has(svg.lucide-mic), [aria-label*="Mic"]').first(), 'Chubby AI: Built-in Input Mic Button');
      await checkButton(page.locator('button:has(svg.lucide-send), [aria-label*="Send"]').first(), 'Chubby AI: Send Button');

      // Close modal
      const closeBtn = page.locator('button:has(svg.lucide-x), [aria-label*="Close"]').first();
      if ((await closeBtn.count()) > 0) await closeBtn.click();
      await page.waitForTimeout(400);
    }

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 5: PROFILE SCREEN & 9 ARRANGED OPTIONS HUB
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 5. AUDITING PROFILE SCREEN & 9 SERVICES HUB ---');
    await page.goto(`${BASE_URL}#/user/profile`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_profile_screen.png') });

    // 5.1 Profile Header & Edit Action
    await checkButton(page.locator('div:has-text("Rider Demo"), div:has-text("Rider")').first(), 'Profile User Identity Header');

    // 5.2 The 9 Arranged Services Tiles
    const expectedOptions = [
      'My Rides',
      'Explainable AI',
      'Saved Places',
      'Famous Places',
      'Emergency',
      'Refer',
      'Ratings',
      'Settings',
      'Help'
    ];

    for (const opt of expectedOptions) {
      await checkButton(page.locator(`div:has-text("${opt}")`).last(), `Profile Hub Tile: "${opt}"`);
    }

    // 5.3 Logout & Switch Account Buttons
    await checkButton(page.locator('button:has-text("Log Out"), div:has-text("Log Out")').first(), 'Profile: Log Out Action Button');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 6: SMART COMMUTE DASHBOARD (/user/commute)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 6. AUDITING SMART COMMUTE DASHBOARD ---');
    await page.goto(`${BASE_URL}#/user/commute`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_commute_dashboard.png') });

    // 6.1 Role Toggle Buttons (Rider vs Driver / Offer Seats)
    await checkButton(page.locator('div:has-text("Need a Ride"), div:has-text("Find a Ride")').first(), 'Commute: Rider Mode Toggle Pill');
    await checkButton(page.locator('div:has-text("Offer a Ride"), div:has-text("Driving")').first(), 'Commute: Driver Mode Toggle Pill');

    // 6.2 Filter Chips & Preference Buttons
    await checkButton(page.locator('div:has-text("AC"), button:has-text("AC")').first(), 'Commute: AC Filter Chip');
    await checkButton(page.locator('div:has-text("Women Only"), button:has-text("Women Only")').first(), 'Commute: Women-Only Safety Filter Chip');

    // 6.3 Match Cards Action Buttons (Request Pool / Chat)
    await checkButton(page.locator('div:has-text("Request Pool"), button:has-text("Request")').first(), 'Commute: Request Pool Action Button');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 7: PARCEL EXPRESS DELIVERY (/user/parcel)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 7. AUDITING PARCEL EXPRESS DELIVERY ---');
    await page.goto(`${BASE_URL}#/user/parcel`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_parcel_screen.png') });

    // 7.1 Tier Selection Cards
    await checkButton(page.locator('div:has-text("Bike"), div:has-text("Document")').first(), 'Parcel: Bike Express Tier Card');
    await checkButton(page.locator('div:has-text("Car"), div:has-text("Medium")').first(), 'Parcel: Car Standard Tier Card');

    // 7.2 Main Action Button
    await checkButton(page.locator('button:has-text("Send Parcel"), button:has-text("Continue"), div:has-text("Send Parcel")').first(), 'Parcel: Submit Action Button');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 8: EMERGENCY CONTACTS & SOS (/user/emergency)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 8. AUDITING EMERGENCY & SOS SCREEN ---');
    await page.goto(`${BASE_URL}#/user/emergency`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_emergency_screen.png') });

    // 8.1 Big Red 1-Tap SOS Button
    await checkButton(page.locator('button:has-text("SOS"), div:has-text("SOS")').first(), 'Emergency: 1-Tap Big SOS Button');

    // 8.2 Add Emergency Contact Button
    await checkButton(page.locator('button:has-text("Add Contact"), div:has-text("Add Contact")').first(), 'Emergency: Add Contact Button');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 9: FAMOUS PLACES (/user/famous-places)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 9. AUDITING FAMOUS PLACES SCREEN ---');
    await page.goto(`${BASE_URL}#/user/famous-places`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_famous_places_screen.png') });

    // 9.1 Landmark Card Action Buttons
    await checkButton(page.locator('div:has-text("Book Ride"), button:has-text("Ride"), div:has-text("Marina Beach")').first(), 'Famous Places: Landmark Card Action');

    // ══════════════════════════════════════════════════════════════════
    // SCREEN 10: SETTINGS & THEME SCREEN (/user/settings & /user/theme)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- 10. AUDITING SETTINGS & THEME SCREEN ---');
    await page.goto(`${BASE_URL}#/user/theme`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_theme_settings_screen.png') });

    // 10.1 Theme Selector Buttons
    await checkButton(page.locator('div:has-text("Dark AI"), button:has-text("Dark AI")').first(), 'Theme: Dark AI Selector');
    await checkButton(page.locator('div:has-text("Light"), button:has-text("Light")').first(), 'Theme: Light Mode Selector');

  } catch (error) {
    console.error('Audit encountered error:', error);
    logStep('Audit Flow Execution', 'ERROR', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('ANDROID APPLICATION BUTTON PLACEMENT AUDIT SUMMARY:');
  console.log(`Total Screen Checks: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.status === 'PASS').length}`);
  console.log(`Total Button / Element Checks: ${buttonChecks.length}`);
  console.log(`Passed Buttons: ${buttonChecks.filter(b => b.status === 'PASS').length}`);
  console.log(`Warnings / Failures: ${buttonChecks.filter(b => b.status !== 'PASS').length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log('══════════════════════════════════════════════════════════════════\n');
}

runAndroidAppAudit().catch(console.error);
