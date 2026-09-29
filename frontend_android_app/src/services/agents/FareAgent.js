/**
 * Fare Agent
 * Analyzes absolute fare, relative price difference vs category average/min, price per km, and fare trend.
 */

export const FareAgent = {
  name: 'Fare Agent',

  evaluate: (option, categoryMinFare, categoryAvgFare, routeDistanceKm = 8.5) => {
    const absoluteFare = option.fare;
    const diffVsMin = absoluteFare - categoryMinFare;
    const isCheapest = diffVsMin === 0;

    // Score from 0 to 100 based on price relative to minimum
    const fareRatio = categoryMinFare / (absoluteFare || 1);
    const fareScore = Math.min(100, Math.max(30, Math.round(fareRatio * 100)));

    const farePerKm = (absoluteFare / (routeDistanceKm || 1)).toFixed(1);

    let priceTrend = 'stable';
    if (option.fareDelta < 0) priceTrend = 'dropped';
    if (option.fareDelta > 0) priceTrend = 'increased';

    let summaryText = isCheapest
      ? `Cheapest in category (₹${absoluteFare})`
      : `₹${diffVsMin} higher than cheapest option`;

    if (option.fareDelta < 0) {
      summaryText += ` · Price dropped by ₹${Math.abs(option.fareDelta)}`;
    }

    return {
      fareScore,
      isCheapest,
      diffVsMin,
      farePerKm: Number(farePerKm),
      priceTrend,
      fareDelta: option.fareDelta,
      summaryText,
    };
  }
};
