import { predictRideStability } from './crsp.js';
import { calculateHumanEffort, optimizeRideScore } from './hewro.js';

/**
 * EMMDE - Explainable Multi-Agent Mobility Decision Engine
 * Orchestrates multiple specialized agents to analyze, rate, and recommend
 * the optimal mobility choice with transparent reasoning.
 */
export function executeEMMDE(origin, destination, userWeights, context) {
    const { trafficIndex, precipitation, demandIndex, isPeakHour } = context;

    // Simulate raw ride services based on context sliders
    const rideOptions = [
        // BIKE CATEGORY
        {
            service: 'Rapido Bike',
            provider: 'Rapido',
            mode: 'Bike',
            baseFare: 45,
            baseDuration: 12,
            walkDistance: 30,
            transitions: 0,
            baggageFriendly: false,
            driverRating: 4.9,
            historicCancelRate: 4
        },
        {
            service: 'Ola Bike',
            provider: 'Ola',
            mode: 'Bike',
            baseFare: 48,
            baseDuration: 13,
            walkDistance: 35,
            transitions: 0,
            baggageFriendly: false,
            driverRating: 4.7,
            historicCancelRate: 6
        },
        {
            service: 'Uber Moto',
            provider: 'Uber',
            mode: 'Bike',
            baseFare: 52,
            baseDuration: 13,
            walkDistance: 45,
            transitions: 0,
            baggageFriendly: false,
            driverRating: 4.6,
            historicCancelRate: 7
        },

        // AUTO CATEGORY
        {
            service: 'Rapido Auto',
            provider: 'Rapido',
            mode: 'Auto',
            baseFare: 80,
            baseDuration: 18,
            walkDistance: 60,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.8,
            historicCancelRate: 8
        },
        {
            service: 'Ola Auto',
            provider: 'Ola',
            mode: 'Auto',
            baseFare: 85,
            baseDuration: 19,
            walkDistance: 80,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.7,
            historicCancelRate: 10
        },
        {
            service: 'Uber Auto',
            provider: 'Uber',
            mode: 'Auto',
            baseFare: 90,
            baseDuration: 18,
            walkDistance: 100,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.6,
            historicCancelRate: 14
        },

        // CAB / SEDAN CATEGORY
        {
            service: 'Ola Prime Sedan',
            provider: 'Ola',
            mode: 'Cab',
            baseFare: 205,
            baseDuration: 17,
            walkDistance: 60,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.6,
            historicCancelRate: 11
        },
        {
            service: 'Uber Premier',
            provider: 'Uber',
            mode: 'Cab',
            baseFare: 220,
            baseDuration: 16,
            walkDistance: 50,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.8,
            historicCancelRate: 8
        },
        {
            service: 'Rapido Cabs',
            provider: 'Rapido',
            mode: 'Cab',
            baseFare: 195,
            baseDuration: 17,
            walkDistance: 70,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.7,
            historicCancelRate: 9
        },

        // SUV CATEGORY
        {
            service: 'Ola SUV',
            provider: 'Ola',
            mode: 'SUV',
            baseFare: 320,
            baseDuration: 17,
            walkDistance: 50,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.7,
            historicCancelRate: 7
        },
        {
            service: 'Uber XL (SUV)',
            provider: 'Uber',
            mode: 'SUV',
            baseFare: 340,
            baseDuration: 16,
            walkDistance: 40,
            transitions: 0,
            baggageFriendly: true,
            driverRating: 4.9,
            historicCancelRate: 5
        },

        // MULTIMODAL CATEGORY
        {
            service: 'Aether Multimodal (Metro + Bike)',
            provider: 'Aether',
            mode: 'Multimodal',
            baseFare: 65,
            baseDuration: 15,
            walkDistance: 450,
            transitions: 1,
            baggageFriendly: false,
            driverRating: 4.9,
            historicCancelRate: 1
        }
    ];

    // Compute metrics for each option using specialized agents
    const evaluatedOptions = rideOptions.map(option => {
        // 1. Context Adjustments on fares/durations
        let fare = option.baseFare;
        let duration = option.baseDuration;

        // Apply traffic index to duration (except Metro multimodal which has fixed tracks)
        if (option.mode !== 'Multimodal') {
            // Cabs affected heavily by traffic, bikes less so
            const trafficImpact = option.mode === 'Bike' ? 0.3 : 1.2;
            duration = Math.round(option.baseDuration * (1 + (trafficIndex - 5) * 0.1 * trafficImpact));
        } else {
            // Metro component stable, bike segment slightly affected
            duration = Math.round(option.baseDuration * (1 + (trafficIndex - 5) * 0.03));
        }

        // Apply surge to fares based on traffic, precipitation, and demand Index
        let surgeMultiplier = 1 + (trafficIndex - 5) * 0.08 + (precipitation / 100) * 0.15 + (demandIndex - 5) * 0.04;
        surgeMultiplier = Math.max(1.0, Math.min(2.5, surgeMultiplier)); // capped between 1.0x and 2.5x

        if (option.mode !== 'Multimodal') {
            fare = Math.round(option.baseFare * surgeMultiplier);
        } else {
            // Metro ticket is fixed, only bike segment surges
            fare = Math.round(40 + (25 * surgeMultiplier));
        }

        // 2. Stability Agent (CRSP)
        const stability = predictRideStability(
            option.driverRating,
            option.historicCancelRate,
            trafficIndex,
            precipitation,
            demandIndex,
            isPeakHour
        );

        // 3. Effort Agent (HEWRO)
        const effort = calculateHumanEffort(
            option.walkDistance,
            duration,
            option.transitions,
            option.baggageFriendly,
            precipitation
        );

        // 4. Recommendation Optimizer Agent (HEWRO integration)
        // Normalize whatever weights were passed into cost, time, comfort, stability
        const costWeight = Number(userWeights?.cost ?? userWeights?.fare ?? userWeights?.wFare ?? 0.35);
        const timeWeight = Number(userWeights?.time ?? userWeights?.wTime ?? 0.25);
        let comfortWeight = Number(userWeights?.comfort ?? userWeights?.effort ?? userWeights?.wEffort ?? 0.20);
        const stabilityWeight = Number(userWeights?.stability ?? userWeights?.wStability ?? 0.20);

        if (stability.cancellationProbability > 50) {
            // Penalize comfort weight if cancellation risk is massive
            comfortWeight = Math.max(0.1, comfortWeight - 0.1);
        }

        const adjustedWeights = {
            cost: costWeight,
            time: timeWeight,
            comfort: comfortWeight,
            stability: stabilityWeight
        };

        const recommendationScore = optimizeRideScore(fare, duration, effort.effortScore, adjustedWeights);

        return {
            name: option.service,
            provider: option.provider,
            mode: option.mode,
            fare,
            duration,
            surgeMultiplier: Math.round(surgeMultiplier * 10) / 10,
            stability,
            effort,
            recommendationScore
        };
    });

    // Sort options by recommendation score in descending order
    evaluatedOptions.sort((a, b) => b.recommendationScore - a.recommendationScore);

    const bestChoice = evaluatedOptions[0];

    // 5. Explainability Agent - generates conversational justification reasoning
    let reasoning = '';
    if (bestChoice.mode === 'Bike') {
        reasoning = `Aether-AI recommended ${bestChoice.name} as it bypasses current heavy traffic delays (congestion index ${trafficIndex}/10) saving you ${bestChoice.duration} minutes of travel, while maintaining low cancellation probability (${bestChoice.stability.cancellationProbability}%).`;
    } else if (bestChoice.mode === 'Multimodal') {
        const cabOption = evaluatedOptions.find(o => o.mode === 'Cab');
        const costSavings = cabOption ? Math.max(0, cabOption.fare - bestChoice.fare) : 50;
        reasoning = `Selected ${bestChoice.name} because it bypasses congestion via Metro tracks, offering a highly stable travel window (${bestChoice.stability.status}) and cost savings of ₹${costSavings} compared to cab options.`;
    } else {
        reasoning = `Selected ${bestChoice.name} which matches your comfort preferences, maintaining a low cancellation probability of ${bestChoice.stability.cancellationProbability}% and stable cabin comfort during precipitation index (${precipitation}%).`;
    }

    return {
        bestRide: bestChoice,
        allOptions: evaluatedOptions,
        options: evaluatedOptions,
        contextInfo: {
            trafficIndex,
            precipitation,
            demandIndex,
            isPeakHour
        },
        reasoning,
        aiConfidenceScore: Math.max(70, Math.min(99, Math.round(98 - (trafficIndex * 1.5) - (precipitation * 0.12))))
    };
}
