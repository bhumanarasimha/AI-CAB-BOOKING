import {
  COMPREHENSIVE_LANDMARKS,
  scoreMatch,
  haversineDistance,
  DEFAULT_USER_COORDS
} from '../../../frontend/src/services/placesService.js';

function getSafeOperatingCoords(coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return DEFAULT_USER_COORDS;
  }
  const inIndia = coords.lat >= 6.0 && coords.lat <= 36.5 && coords.lng >= 68.0 && coords.lng <= 98.0;
  return inIndia ? coords : DEFAULT_USER_COORDS;
}

function searchLocalWithSafeAnchor(query, userCoords, maxDistanceKm = 100) {
  const safeAnchor = getSafeOperatingCoords(userCoords);
  const matches = [];
  for (const item of COMPREHENSIVE_LANDMARKS) {
    const rawScore = scoreMatch(item, query);
    if (rawScore > 0) {
      const distance = haversineDistance(safeAnchor.lat, safeAnchor.lng, item.lat, item.lng);
      if (distance <= maxDistanceKm) {
        matches.push({
          name: item.name,
          address: item.address,
          distanceKm: Math.round(distance * 10) / 10,
          score: rawScore + 15
        });
      }
    }
  }
  matches.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
  return matches;
}

const emulatorCoords = { lat: 37.4219983, lng: -122.084 }; // Mountain View Android Emulator default
const res = searchLocalWithSafeAnchor('pona', emulatorCoords);
const resSave = searchLocalWithSafeAnchor('saveetha', emulatorCoords);

if (res.length === 0 || resSave.length === 0) {
  throw new Error(`Expected emulator geofence fallback matches (pona=${res.length}, saveetha=${resSave.length})`);
}

console.log(`[PASS] Geofence Lock ('pona'): ${res.length} matches -> ${res[0].name} (${res[0].distanceKm} km)`);
console.log(`[PASS] Geofence Lock ('saveetha'): ${resSave.length} matches -> ${resSave[0].name} (${resSave[0].distanceKm} km)`);
