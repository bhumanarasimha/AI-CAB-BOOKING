/**
 * Explainable Multi-Agent Mobility Decision Engine (EMMDE)
 * Integrates Fare, Stability, Human Effort, and Context agents to produce ranked ride recommendations.
 */

import { FareAgent } from './FareAgent';
import { StabilityAgent } from './StabilityAgent';
import { HumanEffortAgent } from './HumanEffortAgent';
import { ContextAgent } from './ContextAgent';
import { ExplainabilityAgent } from './ExplainabilityAgent';

export const DEFAULT_WEIGHTS = {
  fare: 0.35,
  stability: 0.25,
  effort: 0.25,
  context: 0.15,
};

export const EMMDEDecisionEngine = {
  process: ({ rideOptions, userPreferences = 'balanced', contextInputs = {}, routeDistanceKm = 8.5 }) => {
    if (!rideOptions || rideOptions.length === 0) {
      return { rankedOptions: [], topPick: null, decisionExplanation: null };
    }

    // Determine weight multipliers based on user preference
    let weights = { ...DEFAULT_WEIGHTS };
    if (userPreferences === 'cheapest' || userPreferences === 'budget') {
      weights = { fare: 0.60, stability: 0.15, effort: 0.15, context: 0.10 };
    } else if (userPreferences === 'fastest' || userPreferences === 'speed') {
      weights = { fare: 0.15, stability: 0.25, effort: 0.45, context: 0.15 };
    } else if (userPreferences === 'comfort' || userPreferences === 'effort') {
      weights = { fare: 0.15, stability: 0.20, effort: 0.50, context: 0.15 };
    } else if (userPreferences === 'reliable' || userPreferences === 'stability') {
      weights = { fare: 0.15, stability: 0.55, effort: 0.15, context: 0.15 };
    }

    // Calculate category min & average fares
    const fares = rideOptions.map(o => o.fare);
    const categoryMinFare = Math.min(...fares);
    const categoryAvgFare = fares.reduce((a, b) => a + b, 0) / fares.length;

    // Evaluate options across all agents
    const evaluatedOptions = rideOptions.map(option => {
      const fareRes = FareAgent.evaluate(option, categoryMinFare, categoryAvgFare, routeDistanceKm);
      const stabilityRes = StabilityAgent.evaluate(option);
      const effortRes = HumanEffortAgent.evaluate(option);
      const contextRes = ContextAgent.evaluate(option, contextInputs);

      // EMMDE Weighted Score calculation (0 - 100)
      const overallScore = Math.round(
        (fareRes.fareScore * weights.fare) +
        (stabilityRes.stabilityScore * weights.stability) +
        (effortRes.humanEffortScore * weights.effort) +
        (contextRes.contextScore * weights.context)
      );

      return {
        ...option,
        agentBreakdown: {
          fare: fareRes,
          stability: stabilityRes,
          effort: effortRes,
          context: contextRes,
        },
        overallScore,
      };
    });

    // Sort by EMMDE Overall Score descending
    const rankedOptions = [...evaluatedOptions].sort((a, b) => b.overallScore - a.overallScore);
    const topPick = rankedOptions[0];

    // Generate factual explanation
    const decisionExplanation = ExplainabilityAgent.generate({
      topPick,
      allOptions: rankedOptions,
      userPreferences,
      contextInputs,
    });

    return {
      rankedOptions,
      topPick,
      decisionExplanation,
      weightsUsed: weights,
    };
  }
};
