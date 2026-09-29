/**
 * Stability Agent
 * Evaluates ride reliability, ETA consistency, cancellation risk, and provider track record.
 */

export const StabilityAgent = {
  name: 'Stability Agent',

  evaluate: (option) => {
    let cancellationRisk = option.cancellationRisk || 'Low';
    let rawScore = option.stabilityScore || 90;

    if (!option.availability) {
      return {
        stabilityScore: 0,
        cancellationRisk: 'High',
        reliabilityCategory: 'Unavailable',
        summaryText: 'Driver unavailable at current location',
      };
    }

    let reliabilityCategory = 'High Reliability';
    if (rawScore >= 90) {
      reliabilityCategory = 'Exceptional Reliability';
    } else if (rawScore >= 75) {
      reliabilityCategory = 'Moderate Reliability';
    } else {
      reliabilityCategory = 'Elevated Cancellation Risk';
    }

    const summaryText = `${reliabilityCategory} (${cancellationRisk} cancellation risk)`;

    return {
      stabilityScore: rawScore,
      cancellationRisk,
      reliabilityCategory,
      summaryText,
    };
  }
};
