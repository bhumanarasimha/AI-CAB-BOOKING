import { COMPREHENSIVE_LANDMARKS, scoreMatch, haversineDistance, DEFAULT_USER_COORDS } from '../frontend/src/services/placesService.js';

function getSafeOperatingCoords(coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return DEFAULT_USER_COORDS;
  }
  const inIndia = coords.lat >= 6.0 && coords.lat <= 36.5 && coords.lng >= 68.0 && coords.lng <= 98.0;
  if (!inIndia) {
    return DEFAULT_USER_COORDS;
  }
  return coords;
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

const emulatorCoords = { lat: 37.4219983, lng: -122.084 }; // Mountain View from Android Emulator screenshot!
const res = searchLocalWithSafeAnchor('pona', emulatorCoords);
console.log(`Results for 'pona' with emulator coords: ${res.length}`);
res.forEach(r => console.log(` - ${r.name} (${r.distanceKm} km, score: ${r.score})`));

const resSave = searchLocalWithSafeAnchor('saveetha', emulatorCoords);
console.log(`\nResults for 'saveetha' with emulator coords: ${resSave.length}`);
resSave.forEach(r => console.log(` - ${r.name} (${r.distanceKm} km, score: ${r.score})`));
