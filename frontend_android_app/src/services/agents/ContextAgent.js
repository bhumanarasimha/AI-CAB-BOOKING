/**
 * Context Agent
 * Adjusts scores according to contextual inputs: weather (rain), time of day, urgency, and traffic.
 */

export const ContextAgent = {
  name: 'Context Agent',

  evaluate: (option, contextInputs = {}) => {
    const { weather = 'clear', urgency = 'normal', isNight = false } = contextInputs;
    
    let baseScore = 85;
    let modifiers = [];

    // Weather rules: Rain heavily penalizes bikes, slightly penalizes autos, favors enclosed cabs/metro
    if (weather === 'rain' || weather === 'monsoon') {
      if (option.category === 'bike') {
        baseScore -= 45;
        modifiers.push('Rain penalty for open bike (-45)');
      } else if (option.category === 'auto') {
        baseScore -= 15;
        modifiers.push('Minor rain penalty for auto (-15)');
      } else {
        baseScore += 10;
        modifiers.push('Weather protection bonus (+10)');
      }
    }

    // Urgency rules: favors fast ETAs
    if (urgency === 'urgent' && option.eta <= 10) {
      baseScore += 15;
      modifiers.push('Fast ETA urgency bonus (+15)');
    }

    // Night safety rules
    if (isNight && (option.category === 'cab4' || option.category === 'cab7')) {
      baseScore += 10;
      modifiers.push('Night enclosed vehicle safety bonus (+10)');
    }

    const contextScore = Math.min(100, Math.max(10, baseScore));

    return {
      contextScore,
      modifiers,
      summaryText: modifiers.length > 0 ? modifiers.join(' · ') : 'Optimal weather & route conditions',
    };
  }
};
