import { calculateRouteDistanceKm, computeRealtimeFare, computeRealtimeEta } from '../pricing/realtimeFareEngine';

export const SmartRideProvider = {
  name: 'SmartRide AI',

  fetchOptions: async ({ origin, destination }) => {
    const distKm = calculateRouteDistanceKm(origin, destination);

    const transitFare = Math.min(65, Math.max(25, Math.round(20 + distKm * 1.1)));

    return [
      {
        rawProvider: 'SmartRide AI',
        type: 'SmartRide Bike',
        category: 'bike',
        cost: computeRealtimeFare({ provider: 'SmartRide AI', type: 'SmartRide Bike', baseFare: 25, ratePerKm: 9.8, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'bike'),
        pickupMeters: 140,
        isAvailable: true,
        cancellationRiskScore: 0.04,
        historicalReliability: 0.98,
        status: 'LIVE',
        source: 'smartride_network',
      },
      {
        rawProvider: 'SmartRide AI',
        type: 'SmartRide Auto',
        category: 'auto',
        cost: computeRealtimeFare({ provider: 'SmartRide AI', type: 'SmartRide Auto', baseFare: 45, ratePerKm: 13.2, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'auto'),
        pickupMeters: 90,
        isAvailable: true,
        cancellationRiskScore: 0.03,
        historicalReliability: 0.98,
        status: 'LIVE',
        source: 'smartride_network',
      },
      {
        rawProvider: 'SmartRide AI',
        type: 'SmartRide AI (Cab+Metro)',
        category: 'cab4',
        cost: computeRealtimeFare({ provider: 'SmartRide AI', type: 'SmartRide Cab+Metro', baseFare: 40, ratePerKm: 11.5, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'cab4'),
        pickupMeters: 130,
        isAvailable: true,
        cancellationRiskScore: 0.02,
        historicalReliability: 0.99,
        status: 'LIVE',
        source: 'smartride_network',
      },
      {
        rawProvider: 'SmartRide AI',
        type: 'SmartRide XL',
        category: 'cab7',
        cost: computeRealtimeFare({ provider: 'SmartRide AI', type: 'SmartRide XL', baseFare: 150, ratePerKm: 28.0, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'cab7'),
        pickupMeters: 180,
        isAvailable: true,
        cancellationRiskScore: 0.04,
        historicalReliability: 0.97,
        status: 'LIVE',
        source: 'smartride_network',
      },
      {
        rawProvider: 'SmartRide AI',
        type: 'Public Transit (Metro + Bus)',
        category: 'transit',
        cost: transitFare,
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'transit'),
        pickupMeters: 160,
        isAvailable: true,
        cancellationRiskScore: 0.01,
        historicalReliability: 0.99,
        status: 'LIVE',
        source: 'public_transit_api',
      },
    ];
  }
};
