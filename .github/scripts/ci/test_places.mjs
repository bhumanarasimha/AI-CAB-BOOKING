import { searchLocalLandmarks } from '../../../frontend/src/services/placesService.js';

const userCoords = { lat: 13.0878, lng: 80.2785 };
const res = searchLocalLandmarks('', userCoords, 100, 5);
if (!Array.isArray(res) || res.length === 0) {
  throw new Error('Expected non-empty nearby landmarks for Chennai coordinates');
}
console.log('[PASS] Nearby Chennai landmarks count:', res.length);
res.forEach(r => console.log(` - ${r.name} (${r.distanceKm} km)`));
