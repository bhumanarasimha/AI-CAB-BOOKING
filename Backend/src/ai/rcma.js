/**
 * RCMA - Route Compatibility Matching Algorithm
 * Evaluates the similarity of origin and destination coordinates, departure times,
 * and user preferences to generate a matching score.
 */
export function calculateRouteCompatibility(userA, userB) {
    // 1. Path/Geographic similarity check
    // Simple helper to calculate distance between two coordinates [lat, lng]
    const getDistance = (c1, c2) => {
        const radlat1 = Math.PI * c1[0]/180;
        const radlat2 = Math.PI * c2[0]/180;
        const theta = c1[1]-c2[1];
        const radtheta = Math.PI * theta/180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515 * 1.609344; // in Kilometers
        return dist;
    };

    const distOrigin = getDistance(userA.originCoords, userB.originCoords);
    const distDest = getDistance(userA.destinationCoords, userB.destinationCoords);

    // Geographic compatibility score (100 is identical origin and destination)
    // 0.5km difference drops geographic score slightly, >5km drops it significantly
    let geoScore = 100 - (distOrigin * 8) - (distDest * 8);
    geoScore = Math.max(0, Math.round(geoScore));

    // 2. Departure Time overlap check
    // Parse times (format: "HH:MM") to minutes past midnight
    const getMinutes = (tStr) => {
        const [h, m] = tStr.split(':').map(Number);
        return (h * 60) + m;
    };

    const timeA = getMinutes(userA.departureTime);
    const timeB = getMinutes(userB.departureTime);
    const timeDiff = Math.abs(timeA - timeB);

    // Time compatibility score (drops by 1.5 points per minute of difference)
    let timeScore = 100 - (timeDiff * 1.5);
    timeScore = Math.max(0, Math.round(timeScore));

    // 3. Gender preference check
    let preferencesMatch = true;
    if (userA.genderPreference === 'same' && userA.gender !== userB.gender) {
        preferencesMatch = false;
    }
    if (userB.genderPreference === 'same' && userB.gender !== userA.gender) {
        preferencesMatch = false;
    }

    // 4. Combined Route Compatibility Score
    let overallScore = 0;
    if (preferencesMatch) {
        // 60% Geographic similarity + 40% Time synchronicity
        overallScore = Math.round((geoScore * 0.6) + (timeScore * 0.4));
    } else {
        overallScore = 0; // Incompatible due to safety preferences
    }

    // Adjust compatibility if they are both verified employees (office email verified)
    if (userA.isVerified && userB.isVerified && overallScore > 0) {
        overallScore = Math.min(100, overallScore + 5); // Verification trust bonus
    }

    return {
        compatibilityScore: overallScore, // 0 - 100
        distanceFrictionKm: Math.round((distOrigin + distDest) * 10) / 10,
        timeFrictionMinutes: timeDiff,
        isMatchable: overallScore >= 65
    };
}
