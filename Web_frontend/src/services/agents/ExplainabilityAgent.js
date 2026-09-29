/**
 * Explainability Agent
 * Generates transparent, data-backed rationale explaining why the top option was chosen
 * and why alternative options (e.g. cheapest option) were overridden if applicable.
 */

export const ExplainabilityAgent = {
  name: 'Explainability Agent',

  generate: ({ topPick, allOptions, userPreferences }) => {
    if (!topPick) return null;

    const reasons = [];

    const cheapestOption = [...allOptions].sort((a, b) => a.fare - b.fare)[0];
    const fastestOption = [...allOptions].sort((a, b) => a.eta - b.eta)[0];
    const mostReliable = [...allOptions].sort((a, b) => b.stabilityScore - a.stabilityScore)[0];

    // Check fare rationale
    if (topPick.id === cheapestOption.id) {
      reasons.push(`✓ Lowest fare in category (₹${topPick.fare})`);
    } else {
      const fareDiff = topPick.fare - cheapestOption.fare;
      reasons.push(`✓ ₹${fareDiff} more than cheapest option, but offers significantly higher reliability & lower pickup effort`);
    }

    // Check ETA rationale
    if (topPick.id === fastestOption.id) {
      reasons.push(`✓ Fastest pickup time (${topPick.eta} min ETA)`);
    } else {
      const etaDiff = topPick.eta - fastestOption.eta;
      if (etaDiff <= 3) {
        reasons.push(`✓ Pickup ETA (${topPick.eta} min) is within ${etaDiff} min of fastest option`);
      }
    }

    // Check stability & pickup distance
    if (topPick.stabilityScore >= 90) {
      reasons.push(`✓ Low estimated cancellation risk (${topPick.agentBreakdown.stability.cancellationRisk})`);
    }

    if (topPick.pickupDistance <= 200) {
      reasons.push(`✓ Short pickup distance (${topPick.pickupDistance} m walk)`);
    }

    // Generate "Why not [cheapest non-winner]?" rationale
    let whyNotAlternative = null;
    if (cheapestOption && cheapestOption.id !== topPick.id) {
      const walkDiff = cheapestOption.pickupDistance - topPick.pickupDistance;
      const riskDiff = topPick.stabilityScore - cheapestOption.stabilityScore;

      let altReason = `${cheapestOption.rideType} is ₹${topPick.fare - cheapestOption.fare} cheaper, `;
      if (walkDiff > 200) {
        altReason += `but requires ${cheapestOption.pickupDistance} m of walking (${walkDiff} m further).`;
      } else if (riskDiff > 10) {
        altReason += `but has a higher estimated cancellation risk (${cheapestOption.cancellationRisk}).`;
      } else {
        altReason += `but has a lower overall comfort and stability score.`;
      }
      whyNotAlternative = {
        alternativeName: cheapestOption.rideType,
        reason: altReason,
      };
    }

    return {
      title: `Recommended: ${topPick.rideType}`,
      reasons,
      whyNotAlternative,
      score: topPick.overallScore,
      userPreferences,
    };
  }
};
