import { calculateRouteDistanceKm, computeRealtimeFare, computeRealtimeEta } from '../pricing/realtimeFareEngine';

export const NammaYatriProvider = {
  name: 'Namma Yatri',
  
  fetchOptions: async ({ origin, destination }) => {
    const distKm = calculateRouteDistanceKm(origin, destination);

    return [
      {
        rawProvider: 'Namma Yatri',
        type: 'Namma Auto (Zero Surge)',
        category: 'auto',
        cost: computeRealtimeFare({ provider: 'Namma Yatri', type: 'Namma Auto', baseFare: 40, ratePerKm: 13.8, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'auto'),
        pickupMeters: 210,
        isAvailable: true,
        cancellationRiskScore: 0.05,
        historicalReliability: 0.96,
        status: 'LIVE',
        source: 'open_network_api',
      },
      {
        rawProvider: 'Namma Yatri',
        type: 'Namma Cab (Direct)',
        category: 'cab4',
        cost: computeRealtimeFare({ provider: 'Namma Yatri', type: 'Namma Cab', baseFare: 90, ratePerKm: 18.2, distanceKm: distKm }),
        currency: '₹',
        durationMin: computeRealtimeEta(distKm, 'cab4'),
        pickupMeters: 240,
        isAvailable: true,
        cancellationRiskScore: 0.06,
        historicalReliability: 0.95,
        status: 'LIVE',
        source: 'open_network_api',
      },
    ];
  }
};
