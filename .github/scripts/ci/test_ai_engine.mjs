import {
  generateMultimodalRoutes,
  computeCrossAppPriceComparison,
  predictFuturePrices,
  resolveRouteDistanceKm
} from '../../../frontend/src/services/ai/SmartMobilityAIEngine.js';

console.log('============================================================');
console.log('  VERIFYING SMARTMOBILITY AI ENGINE (FRONTEND & MOBILE JS)');
console.log('============================================================\n');

const dist = resolveRouteDistanceKm('KG Apartments', 'Marina Beach');
if (!(dist > 20)) {
  throw new Error(`Expected distance > 20km for KG Apartments -> Marina Beach, got ${dist}`);
}
console.log(`[0] Distance Resolved: ${dist} km (KG Apartments -> Marina Beach)\n`);

const mm = generateMultimodalRoutes('KG Apartments', 'Marina Beach', dist);
if (!mm.routes || mm.routes.length < 2) {
  throw new Error('Expected at least 2 multimodal routes');
}
console.log(`[1] GOAL 1: Multimodal Benchmark Rapido Rs${mm.directCabComparison.rapido} / Ola Rs${mm.directCabComparison.ola} / Uber Rs${mm.directCabComparison.uber}`);
mm.routes.forEach((r, i) => {
  console.log(`  Combo ${i + 1}: ${r.title} -> Rs${r.totalFare} (Save Rs${r.savingsFare} / ${r.savingsPercent}%)`);
});

const crossApp = computeCrossAppPriceComparison(dist);
if (!crossApp.cab_economy?.options?.length) {
  throw new Error('Expected cab_economy comparison options');
}
console.log(`\n[2] GOAL 2: Cross-App Economy Cab Options (${crossApp.cab_economy.options.length} providers)`);

const fp = predictFuturePrices(699, dist);
if (!(fp.projectedFareIn15 < fp.currentFare)) {
  throw new Error(`Expected future fare drop below Rs699, got ${fp.projectedFareIn15}`);
}
console.log(`[3] GOAL 3: Future Price Now Rs${fp.currentFare} -> +15m Rs${fp.projectedFareIn15} (Save Rs${fp.savingsIn15})`);
console.log('\n[PASS] ALL 3 AI GOALS VERIFIED!');
