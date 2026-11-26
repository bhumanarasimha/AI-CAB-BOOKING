/**
 * Shared Playwright + Chromium resolution and CI result writer for SmartRide CI scripts.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

function loadPlaywright() {
  for (const mod of ['playwright', 'playwright-core']) {
    try {
      return require(mod);
    } catch {
      // Try next resolution candidate
    }
  }
  const extraPaths = [];
  if (process.env.NODE_PATH) {
    extraPaths.push(...process.env.NODE_PATH.split(path.delimiter).filter(Boolean));
  }
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const codexDir = path.join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'runtimes', 'cua_node');
    if (fs.existsSync(codexDir)) {
      for (const entry of fs.readdirSync(codexDir)) {
        extraPaths.push(path.join(codexDir, entry, 'bin', 'node_modules'));
      }
    }
  }
  for (const baseDir of extraPaths) {
    for (const mod of ['playwright', 'playwright-core']) {
      const candidate = path.join(baseDir, mod);
      if (fs.existsSync(candidate)) {
        return require(candidate);
      }
    }
  }
  throw new Error('Could not resolve playwright or playwright-core. Run npm install in .github/scripts/ci');
}

function resolveChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
      : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function getArgValue(flag) {
  const prefix = `${flag}=`;
  const hit = process.argv.find(a => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : '';
}

function ensureScreenshotDir(subdir) {
  const dir = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'smartride_ci_screenshots', subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function isFirstPartyUrl(url) {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

function writeJsonReport(suiteName, summary, results, extra = {}) {
  const outPath = getArgValue('--json-out') || process.env.JSON_OUT || '';
  if (!outPath) return;
  const dir = path.dirname(outPath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        suite: suiteName,
        timestamp: new Date().toISOString(),
        summary,
        results,
        ...extra,
      },
      null,
      2
    )
  );
  console.log(`Saved JSON execution report to ${outPath}`);
}

module.exports = {
  loadPlaywright,
  resolveChromeExecutable,
  getArgValue,
  ensureScreenshotDir,
  isFirstPartyUrl,
  writeJsonReport,
};
