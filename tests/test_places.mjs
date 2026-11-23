import { searchAllPlaces, COMPREHENSIVE_LANDMARKS, scoreMatch, searchLocalLandmarks } from '../frontend/src/services/placesService.js';

const userCoords = { lat: 13.0878, lng: 80.2785 };
const res = searchLocalLandmarks('', userCoords, 100, 5);
console.log('Empty query results:', res.length);
res.forEach(r => console.log(' - ' + r.name + ' (' + r.distanceKm + ' km)'));
