/**
 * Target Price Sniper Engine for SmartRide AI / Chubby AI
 * Monitors live cross-app fares (Uber, Ola, Rapido, Namma Yatri, SmartRide AI)
 * and fires instant audio + visual + browser alerts the moment a fare hits the user's target budget.
 */

const STORAGE_KEY = 'chubby_ai_price_snipers_v1';

export function buildRouteKey(pickup, dropoff) {
  return `${(pickup || '').trim().toLowerCase()}__${(dropoff || '').trim().toLowerCase()}`;
}

export function loadAllSnipers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function loadSniperForRoute(pickup, dropoff) {
  const all = loadAllSnipers();
  return all[buildRouteKey(pickup, dropoff)] || null;
}

export function saveSniperForRoute(sniper) {
  try {
    const all = loadAllSnipers();
    const key = buildRouteKey(sniper.pickup, sniper.dropoff);
    all[key] = sniper;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Could not persist price sniper:', err);
  }
}

export function removeSniperForRoute(pickup, dropoff) {
  try {
    const all = loadAllSnipers();
    delete all[buildRouteKey(pickup, dropoff)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Could not clear price sniper:', err);
  }
}

/**
 * Evaluates an armed sniper against the latest live ride quotes & surge curve.
 */
export function evaluateSniperAgainstQuotes(sniper, options = [], futurePricing = null) {
  if (!sniper || !sniper.targetPrice) {
    return {
      isHit: false,
      matchedOption: null,
      bestCurrentOption: null,
      bestCurrentFare: 0,
      gapAmount: 0,
      probabilityPercent: 0,
      estimatedDropMins: null,
      statusText: 'Set a target price to start live monitoring.',
    };
  }

  const target = Math.max(1, Number(sniper.targetPrice));
  const providerFilter = (sniper.provider || 'all').toLowerCase();

  const eligible = (options || []).filter((opt) => {
    if (providerFilter === 'all') return true;
    const key = (opt.providerKey || opt.provider || '').toLowerCase();
    return key.includes(providerFilter);
  });

  const pool = eligible.length > 0 ? eligible : (options || []);
  const sortedByFare = [...pool].sort((a, b) => (a.fare || 99999) - (b.fare || 99999));
  const bestOption = sortedByFare[0] || null;
  const bestCurrentFare = bestOption?.fare || futurePricing?.currentFare || 0;

  const isHit = Boolean(bestOption && bestOption.fare <= target);
  const gapAmount = Math.max(0, bestCurrentFare - target);
  const dropRatio = bestCurrentFare > 0 ? gapAmount / bestCurrentFare : 0;

  // Estimate when future surge curve crosses target
  let estimatedDropMins = null;
  if (isHit) {
    estimatedDropMins = 0;
  } else if (futurePricing?.timeline && Array.isArray(futurePricing.timeline)) {
    const crossingSlot = futurePricing.timeline.find((slot) => slot.fare <= target);
    if (crossingSlot) {
      estimatedDropMins = crossingSlot.offsetMinutes;
    }
  }

  let probabilityPercent;
  let statusText;

  if (isHit) {
    probabilityPercent = 100;
    statusText = `🎯 TARGET HIT! ${bestOption.provider} (${bestOption.rideType}) is live at ₹${bestOption.fare}!`;
  } else if (estimatedDropMins !== null && estimatedDropMins <= 20) {
    probabilityPercent = 88;
    statusText = `High hit probability — surge forecast shows ₹${target} reachable in ~${estimatedDropMins} mins.`;
  } else if (dropRatio <= 0.12) {
    probabilityPercent = 82;
    estimatedDropMins = estimatedDropMins ?? 15;
    statusText = `Only ₹${gapAmount} above target — likely to drop within 10–15 mins.`;
  } else if (dropRatio <= 0.25) {
    probabilityPercent = 60;
    estimatedDropMins = estimatedDropMins ?? 30;
    statusText = `₹${gapAmount} away — watching live across ${providerFilter === 'all' ? 'all apps' : sniper.provider}.`;
  } else {
    probabilityPercent = 25;
    estimatedDropMins = estimatedDropMins ?? 45;
    statusText = `Ambitious target (₹${gapAmount} below live fare). Tip: check Smart Routes or Bike/Auto for instant savings!`;
  }

  return {
    isHit,
    matchedOption: isHit ? bestOption : null,
    bestCurrentOption: bestOption,
    bestCurrentFare,
    gapAmount,
    probabilityPercent,
    estimatedDropMins,
    statusText,
  };
}

/**
 * Plays a pleasant two-tone Web Audio alert chime when Target Price Sniper locks on!
 */
export function playSniperAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [880, 1174.66]; // A5 -> D6 crisp alert chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.3);
    });
  } catch {
    // Audio playback may be blocked until user gesture; fail silently
  }
}

export function fireSniperNotification(title, body) {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    // Ignore unsupported environments (e.g., Android WebView)
  }
}

export async function requestSniperNotificationPermission() {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch {
    // Ignore
  }
}

export async function syncSniperToBackend(sniper, currentBestFare) {
  try {
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : '';
    if (!baseUrl) return;
    await fetch(`${baseUrl}/api/ai/sniper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sniper,
        currentBestFare,
      }),
    });
  } catch {
    // Offline/Android WebView gracefully runs purely client-side
  }
}
