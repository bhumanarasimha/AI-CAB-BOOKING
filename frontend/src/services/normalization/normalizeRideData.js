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

  let providerKey = 'other';
  let deepLink = null;
  let url = 'https://m.uber.com/';
  let brandColor = '#00D8FF';
  let brandTextColor = '#080C14';
  let buttonText = 'Book Now';

  const providerLower = (rawItem.rawProvider || '').toLowerCase();

  if (providerLower.includes('uber')) {
    providerKey = 'uber';
    brandColor = '#000000';
    brandTextColor = '#FFFFFF';
    deepLink = 'uber://?action=setPickup&pickup=my_location';
    url = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location';
    buttonText = 'Book on Uber';
  } else if (providerLower.includes('ola')) {
    providerKey = 'ola';
    brandColor = '#00C853';
    brandTextColor = '#05070A';
    deepLink = 'olacabs://app/launch?landing_page=bk';
    url = 'https://book.olacabs.com/';
    buttonText = 'Book on Ola';
  } else if (providerLower.includes('rapido')) {
    providerKey = 'rapido';
    brandColor = '#FBBF24';
    brandTextColor = '#05070A';
    deepLink = 'rapido://ride';
    url = 'https://rapido.bike/';
    buttonText = 'Book on Rapido';
  } else if (providerLower.includes('namma')) {
    providerKey = 'nammayatri';
    brandColor = '#F59E0B';
    brandTextColor = '#05070A';
    deepLink = 'nammayatri://ride';
    url = 'https://nammayatri.in/';
    buttonText = 'Book on Namma Yatri';
  } else if (isSmart) {
    providerKey = 'smartride';
    brandColor = '#00D8FF';
    brandTextColor = '#080C14';
    deepLink = null;
    url = null;
    buttonText = 'Book SmartRide AI';
  }

  return {
    id,
    provider: rawItem.rawProvider,
    providerKey,
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
    deepLink,
    brandColor,
    brandTextColor,
    buttonText,
  };
};
