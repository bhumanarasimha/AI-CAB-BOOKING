/**
 * CRSP - Contextual Ride Stability Prediction
 * Predicts the probability of ride cancellations and calculates driver stability score.
 */
export function predictRideStability(driverRating, historicCancellationRate, trafficIndex, precipitation, demandIndex, isPeakHour) {
    // Base cancellation probability is the driver's historic cancellation rate (e.g. 15%)
    let cancelProb = historicCancellationRate;

    // Traffic congestion increases cancellations (drivers reject rides when stuck in gridlock)
    cancelProb += (trafficIndex * 2.5);

    // Weather precipitation increases cancellations (shortage of available vehicles, drivers prefer short trips or go offline)
    cancelProb += (precipitation * 0.15);

    // Peak hours increase cancellation chances (more options for drivers)
    if (isPeakHour) {
        cancelProb += 12;
    }

    // High demand increases cancellation chance (drivers cancel to search for higher surges on other apps)
    cancelProb += (demandIndex * 1.5);

    // High driver rating lowers cancellation risk
    const ratingBonus = (5.0 - driverRating) * 20; // Maximum +20% risk for low rated drivers
    cancelProb += ratingBonus;

    // Cap cancellation probability between 2% and 95%
    cancelProb = Math.max(2, Math.min(95, Math.round(cancelProb)));

    // Calculate a stability rating (1 to 5 stars)
    let stabilityRating = 5.0 - (cancelProb / 20.0);
    stabilityRating = Math.max(1.0, Math.min(5.0, Math.round(stabilityRating * 10) / 10));

    return {
        cancellationProbability: cancelProb, // in percentage
        stabilityScore: stabilityRating, // 1.0 - 5.0
        status: cancelProb > 60 ? 'Unstable' : cancelProb > 30 ? 'Moderate' : 'Stable'
    };
}
