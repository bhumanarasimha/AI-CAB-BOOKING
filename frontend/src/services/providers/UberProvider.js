import { calculateRouteDistanceKm, computeRealtimeFare, computeRealtimeEta } from '../pricing/realtimeFareEngine';

export const UberProvider = {
  name: 'Uber',
  
  fetchOptions: async ({ origin, destination }) => {
    const distKm = calculateRouteDistanceKm(origin, destination);

    return [
      {
        rawProvider: 'Uber',
        type: 'Uber Moto',
        category: 'bike',
        cost: computeRealtimeFare({ provider: 'Uber', type: 'Uber Moto', baseFare: 35, ratePerKm: 11.0, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'bike'),
        pickupMeters: 420,
        isAvailable: true,
        cancellationRiskScore: 0.12,
        historicalReliability: 0.90,
        status: 'LIVE',
        source: 'realtime_api',
      },
      {
        rawProvider: 'Uber',
        type: 'Uber Auto',
        category: 'auto',
        cost: computeRealtimeFare({ provider: 'Uber', type: 'Uber Auto', baseFare: 55, ratePerKm: 14.8, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'auto'),
        pickupMeters: 280,
        isAvailable: true,
        cancellationRiskScore: 0.10,
        historicalReliability: 0.92,
        status: 'LIVE',
        source: 'realtime_api',
      },
      {
        rawProvider: 'Uber',
        type: 'Uber Go',
        category: 'cab4',
        cost: computeRealtimeFare({ provider: 'Uber', type: 'Uber Go', baseFare: 110, ratePerKm: 19.5, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'cab4'),
        pickupMeters: 200,
        isAvailable: true,
        cancellationRiskScore: 0.06,
        historicalReliability: 0.96,
        status: 'LIVE',
        source: 'realtime_api',
      },
      {
        rawProvider: 'Uber',
        type: 'Uber XL',
        category: 'cab7',
        cost: computeRealtimeFare({ provider: 'Uber', type: 'Uber XL', baseFare: 180, ratePerKm: 32.0, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'cab7'),
        pickupMeters: 350,
        isAvailable: true,
        cancellationRiskScore: 0.08,
        historicalReliability: 0.94,
        status: 'LIVE',
        source: 'realtime_api',
      },
    ];
  }
};
