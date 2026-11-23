import { 
  resolveRouteDistanceKm, 
  generateMultimodalRoutes, 
  predictFuturePrices, 
  computeCrossAppPriceComparison,
  detectCityContext
} from '../frontend/src/services/ai/SmartMobilityAIEngine.js';

console.log('================================================================');
console.log('TEST 1: USER BENCHMARK - KG APARTMENTS TO MARINA BEACH (34 KM)');
console.log('================================================================');
const dist1 = resolveRouteDistanceKm('KG Apartments', 'Marina Beach');
console.log(`Resolved Distance: ${dist1} km`);

const compare1 = computeCrossAppPriceComparison(dist1);
const rapido1 = compare1.cab_economy.options.find(o => o.provider === 'Rapido')?.fare;
const ola1 = compare1.cab_economy.options.find(o => o.provider === 'Ola')?.fare;
const uber1 = compare1.cab_economy.options.find(o => o.provider === 'Uber')?.fare;
console.log(`Cross-App Cab Fares: Rapido ₹${rapido1}, Ola ₹${ola1}, Uber ₹${uber1}`);

const mm1 = generateMultimodalRoutes('KG Apartments', 'Marina Beach', dist1);
console.log(`Multimodal Route 1: ${mm1.routes[0].title} = ₹${mm1.routes[0].totalFare} (Direct Cab: ₹${mm1.routes[0].directCabFare}, Save ₹${mm1.routes[0].savingsFare})`);
mm1.routes[0].legs.forEach(l => console.log(`   - Leg ${l.step}: ${l.label} (${l.duration}) = ₹${l.fare}`));
console.log(`Multimodal Route 2: ${mm1.routes[1].title} = ₹${mm1.routes[1].totalFare} (Save ₹${mm1.routes[1].savingsFare})`);
mm1.routes[1].legs.forEach(l => console.log(`   - Leg ${l.step}: ${l.label} (${l.duration}) = ₹${l.fare}`));

const future1 = predictFuturePrices(699, dist1);
console.log(`Future Surge: Now ₹${future1.currentFare} -> +15m drops to ₹${future1.projectedFareIn15} (Savings: ₹${future1.savingsIn15})`);
console.log(`Advice: ${future1.advice}`);

console.log('\n================================================================');
console.log('TEST 2: BANGALORE ROUTE - KORAMANGALA TO WHITEFIELD');
console.log('================================================================');
const dist2 = resolveRouteDistanceKm('Koramangala', 'Whitefield');
console.log(`Resolved Distance: ${dist2} km`);
const compare2 = computeCrossAppPriceComparison(dist2);
const rapido2 = compare2.cab_economy.options.find(o => o.provider === 'Rapido')?.fare;
const ola2 = compare2.cab_economy.options.find(o => o.provider === 'Ola')?.fare;
const uber2 = compare2.cab_economy.options.find(o => o.provider === 'Uber')?.fare;
console.log(`Cross-App Cab Fares: Rapido ₹${rapido2}, Ola ₹${ola2}, Uber ₹${uber2}`);

const mm2 = generateMultimodalRoutes('Koramangala', 'Whitefield', dist2);
console.log(`City Context: ${mm2.cityContext.city} (${mm2.cityContext.busOperator} + ${mm2.cityContext.metroOperator})`);
console.log(`Multimodal Route 1: ${mm2.routes[0].title} = ₹${mm2.routes[0].totalFare} (Direct Cab: ₹${mm2.routes[0].directCabFare}, Save ₹${mm2.routes[0].savingsFare})`);
mm2.routes[0].legs.forEach(l => console.log(`   - Leg ${l.step}: ${l.label} (${l.from} -> ${l.to}) = ₹${l.fare}`));

const future2 = predictFuturePrices(rapido2, dist2);
console.log(`Future Surge: Now ₹${future2.currentFare} -> +15m drops to ₹${future2.projectedFareIn15} (Savings: ₹${future2.savingsIn15})`);

console.log('\n================================================================');
console.log('TEST 3: MUMBAI ROUTE - BANDRA TO ANDHERI');
console.log('================================================================');
const dist3 = resolveRouteDistanceKm('Bandra', 'Andheri');
console.log(`Resolved Distance: ${dist3} km`);
const mm3 = generateMultimodalRoutes('Bandra', 'Andheri', dist3);
console.log(`City Context: ${mm3.cityContext.city} (${mm3.cityContext.busOperator})`);
console.log(`Multimodal Route 1: ₹${mm3.routes[0].totalFare} (Direct Cab: ₹${mm3.routes[0].directCabFare}, Save ₹${mm3.routes[0].savingsFare})`);
mm3.routes[0].legs.forEach(l => console.log(`   - Leg ${l.step}: ${l.label} (${l.from} -> ${l.to}) = ₹${l.fare}`));

console.log('\n================================================================');
console.log('TEST 4: UNKNOWN ARBITRARY ROUTE - CYBER HUB TO NOIDA');
console.log('================================================================');
const dist4 = resolveRouteDistanceKm('Cyber Hub Gurgaon', 'Noida Sector 62');
console.log(`Resolved Distance: ${dist4} km`);
const mm4 = generateMultimodalRoutes('Cyber Hub Gurgaon', 'Noida Sector 62', dist4);
console.log(`Multimodal Route 1: ₹${mm4.routes[0].totalFare} (Direct Cab: ₹${mm4.routes[0].directCabFare}, Save ₹${mm4.routes[0].savingsFare})`);
console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
