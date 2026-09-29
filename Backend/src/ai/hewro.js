/**
 * HEWRO - Human Effort Weighted Ride Optimization
 * Computes a standardized "Human Effort Score" (0 to 100, where 100 is maximum physical/mental exhaustion)
 * and uses user preferences to weight comfort vs time vs cost.
 */
export function calculateHumanEffort(walkDistanceMeters, waitTimeMinutes, transitionsCount, baggageFriendly, precipitation) {
    let effortScore = 0;

    // 1. Walking effort (approx 10 points per 500m walked)
    effortScore += (walkDistanceMeters / 50);

    // 2. Waiting friction (1.5 points per minute of waiting at platforms/curbs)
    effortScore += (waitTimeMinutes * 1.5);

    // 3. Multimodal transition complexity (15 points per connection switch)
    effortScore += (transitionsCount * 15);

    // 4. Weather multiplier (rain increases friction, especially for walking/bike transits)
    if (precipitation > 30) {
        effortScore += (precipitation * 0.25);
    }

    // 5. Baggage restriction friction
    if (!baggageFriendly) {
        effortScore += 20; // e.g. carrying bags on a bike taxi or metro is high effort
    }

    // Cap the effort score between 5 and 100
    effortScore = Math.max(5, Math.min(100, Math.round(effortScore)));

    // Generate descriptive labels
    let description = 'Comfortable Direct Journey';
    if (effortScore > 65) {
        description = 'High Physical Effort Route';
    } else if (effortScore > 35) {
        description = 'Moderate Active Commute';
    }

    return {
        effortScore,
        description,
        metrics: {
            walkDistanceMeters,
            waitTimeMinutes,
            transitionsCount,
            baggageFriendly
        }
    };
}

/**
 * Optimizes rides using the HEWRO score balanced against cost and time based on user weights.
 * userWeights: { cost: 0-1, time: 0-1, comfort: 0-1 }
 */
export function optimizeRideScore(farePrice, durationMinutes, effortScore, userWeights = { cost: 0.4, time: 0.3, comfort: 0.3 }) {
    // Normalize parameters to 0-100 scale for comparison
    // Fare price normalized (e.g. ₹50 -> 10, ₹500 -> 100)
    const normCost = Math.min(100, (farePrice / 5));
    // Time normalized (e.g. 5 mins -> 10, 50 mins -> 100)
    const normTime = Math.min(100, durationMinutes * 2);
    // Effort score is already 0-100
    const normEffort = effortScore;

    // HEWRO Cost Formula: weighted sum of normalized variables
    // Note: Since we want to recommend the BEST option, lower scores represent lower negative impacts.
    // We can invert this to create a "Recommendation Score" out of 100 (where 100 is perfect)
    const totalDisutility = (
        (normCost * userWeights.cost) +
        (normTime * userWeights.time) +
        (normEffort * userWeights.comfort)
    );

    const recommendationScore = Math.max(10, Math.min(100, Math.round(100 - totalDisutility)));

    return recommendationScore;
}
