import {
  resolveRouteDistanceKm,
  generateMultimodalRoutes,
  predictFuturePrices,
  computeCrossAppPriceComparison
} from '../../../frontend/src/services/ai/SmartMobilityAIEngine.js';

const cases = [
  ['KG Apartments', 'Marina Beach', 'Chennai'],
  ['Koramangala', 'Whitefield', 'Bangalore'],
  ['Bandra', 'Andheri', 'Mumbai'],
  ['Cyber Hub Gurgaon', 'Noida Sector 62', 'Delhi-NCR']
];

for (const [pickup, dropoff, label] of cases) {
  const dist = resolveRouteDistanceKm(pickup, dropoff);
  const cmp = computeCrossAppPriceComparison(dist);
  const mm = generateMultimodalRoutes(pickup, dropoff, dist);
  const rapido = cmp.cab_economy.options.find(o => o.provider === 'Rapido')?.fare || 400;
  const future = predictFuturePrices(rapido, dist);

  if (!(dist > 0) || !mm.routes?.length || !(future.projectedFareIn15 > 0)) {
    throw new Error(`Dynamic AI Engine check failed for ${label}: ${pickup} -> ${dropoff}`);
  }
  console.log(`[PASS] ${label}: ${pickup} -> ${dropoff} (${dist} km) | Multimodal Rs${mm.routes[0].totalFare} (Save Rs${mm.routes[0].savingsFare}) | Future +15m Rs${future.projectedFareIn15}`);
}

console.log('ALL DYNAMIC ROUTE VERIFICATIONS PASSED SUCCESSFULLY!');
