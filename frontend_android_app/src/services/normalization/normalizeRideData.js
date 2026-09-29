export const normalizeRideData = (rawItem, previousItem = null, timestamp = new Date()) => {
  const id = `${rawItem.rawProvider.toLowerCase()}_${rawItem.type.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  const currentFare = rawItem.cost;
  const prevFare = previousItem ? previousItem.fare : null;
  const fareDelta = prevFare !== null ? currentFare - prevFare : 0;

  const currentEta = rawItem.durationMin;
  const prevEta = previousItem ? previousItem.eta : null;
  const etaDelta = prevEta !== null ? currentEta - prevEta : 0;

  const pickupMeters = rawItem.pickupMeters || 200;
  const riskScore = rawItem.cancellationRiskScore || 0.10;

  const cancellationRisk = riskScore < 0.08 ? 'Low' : riskScore < 0.16 ? 'Medium' : 'High';
  
  const stabilityScore = Math.round((1 - riskScore) * 100);
  const humanEffortScore = Math.max(20, Math.round(100 - (pickupMeters / 12) - (currentEta * 1.2)));
  const contextScore = 88;

  const isSmart = rawItem.rawProvider === 'SmartRide AI';

  let url = null;
  if (rawItem.rawProvider === 'Rapido') url = 'https://rapido.bike/';
  if (rawItem.rawProvider === 'Uber') url = 'https://m.uber.com/';
  if (rawItem.rawProvider === 'Ola') url = 'https://book.olacabs.com/';

  return {
    id,
    provider: rawItem.rawProvider,
    rideType: rawItem.type,
    category: rawItem.category || 'cab4',
    fare: currentFare,
    previousFare: prevFare,
    fareDelta,
    currency: rawItem.currency || '₹',
    eta: currentEta,
    previousEta: prevEta,
    etaDelta,
    pickupDistance: pickupMeters,
    availability: rawItem.isAvailable !== false,
    cancellationRisk,
    stabilityScore,
    humanEffortScore,
    contextScore,
    overallScore: 85,
    lastUpdated: timestamp,
    updatedSecondsAgo: 0,
    dataSource: rawItem.source || 'realtime_api',
    dataStatus: rawItem.status || 'LIVE',
    isSmart,
    url,
  };
};
