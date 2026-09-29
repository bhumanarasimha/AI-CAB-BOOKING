/**
 * Human Effort Agent
 * Evaluates walking distance to pickup point, waiting time, pickup complexity, and physical effort.
 * Key Principle: Cheapest ≠ automatically best if it requires heavy walking or long waiting friction.
 */

export const HumanEffortAgent = {
  name: 'Human Effort Agent',

  evaluate: (option) => {
    const pickupMeters = option.pickupDistance || 200;
    const waitMin = option.eta || 10;

    // Score from 0 to 100 where 100 means zero effort/instant pickup
    const walkPenalty = Math.min(50, (pickupMeters / 15));
    const waitPenalty = Math.min(40, (waitMin * 2));
    const effortScore = Math.max(10, Math.round(100 - walkPenalty - waitPenalty));

    let effortLevel = 'Minimal Effort';
    if (effortScore >= 85) effortLevel = 'Lowest Physical Effort';
    else if (effortScore >= 70) effortLevel = 'Moderate Effort';
    else effortLevel = 'High Pickup Friction';

    let summaryText = `${pickupMeters} m pickup walk · ${waitMin} min wait`;
    if (pickupMeters > 500) {
      summaryText += ` (Requires ${Math.round(pickupMeters/80)} min walk)`;
    }

    return {
      humanEffortScore: effortScore,
      pickupMeters,
      waitMin,
      effortLevel,
      summaryText,
    };
  }
};
