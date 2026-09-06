import { DepartmentStanding, MatchScoreBreakdown, MealLog, RecipientOrg, SurplusEntry } from '../types';

/**
 * Calculates time elapsed from ISO timestamp and returns status:
 * - "Recently reported" (green) if < 2 hours
 * - "Needs prompt action" (yellow) if 2-6 hours
 * - "No longer available" (red) if > 6 hours or claimed
 */
export function getSurplusStatus(entry: SurplusEntry, currentTimeMs: number = Date.now()): {
  label: string;
  pillColor: string;
  code: 'recent' | 'urgent' | 'expired';
  hoursAgo: number;
} {
  if (entry.status === 'claimed') {
    return {
      label: 'Claimed & Dispatched',
      pillColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      code: 'expired',
      hoursAgo: 0,
    };
  }

  const reportedTime = new Date(entry.reportedAt).getTime();
  const diffHours = (currentTimeMs - reportedTime) / (1000 * 60 * 60);

  if (diffHours < 2) {
    return {
      label: 'Recently reported',
      pillColor: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
      code: 'recent',
      hoursAgo: Math.max(0, Math.round(diffHours * 10) / 10),
    };
  } else if (diffHours <= 6) {
    return {
      label: 'Needs prompt action',
      pillColor: 'bg-amber-50 text-amber-700 border-amber-300 font-medium',
      code: 'urgent',
      hoursAgo: Math.round(diffHours * 10) / 10,
    };
  } else {
    return {
      label: 'No longer available',
      pillColor: 'bg-rose-50 text-rose-700 border-rose-300 font-medium',
      code: 'expired',
      hoursAgo: Math.round(diffHours * 10) / 10,
    };
  }
}

/**
 * Transparent Surplus Matching Scoring Function (Explicitly NOT an AI black box)
 * Total Score = Distance Fit (0-40) + Capacity Fit (0-30) + Food-Type Match (0-30) = 100 max
 */
export function calculateSurplusMatches(
  surplus: { foodType: string; quantityMeals: number },
  recipientOrgs: RecipientOrg[]
): MatchScoreBreakdown[] {
  const matches: MatchScoreBreakdown[] = recipientOrgs.map((org) => {
    // 1. Distance score (0-40): 40 pts if <= 1km, losing 4 pts per km, floor at 0
    const distanceScore = Math.max(0, Math.round(40 - org.distanceKm * 4));

    // 2. Capacity Fit score (0-30):
    // Ideal if org capacity is between 75% and 250% of surplus quantity
    let capacityFitScore = 0;
    const ratio = surplus.quantityMeals / (org.typicalCapacityMeals || 1);
    if (ratio <= 1.0) {
      // Org can absorb all of it comfortably
      capacityFitScore = Math.round(30 * (1 - Math.abs(1 - ratio) * 0.4));
    } else {
      // Surplus exceeds single-run capacity, partial match
      capacityFitScore = Math.max(5, Math.round(30 * (1 / ratio)));
    }
    capacityFitScore = Math.min(30, Math.max(0, capacityFitScore));

    // 3. Food Type Compatibility score (0-30):
    // Check if food type matches accepted list
    let foodTypeScore = 10; // baseline generic
    const normalizedSurplusType = surplus.foodType.toLowerCase();
    const hasExact = org.foodTypesAccepted.some(
      (ft) =>
        ft.toLowerCase().includes(normalizedSurplusType) ||
        normalizedSurplusType.includes(ft.toLowerCase())
    );
    const hasBroadCooked = org.foodTypesAccepted.some((ft) => ft.toLowerCase().includes('cooked'));

    if (hasExact) {
      foodTypeScore = 30;
    } else if (hasBroadCooked) {
      foodTypeScore = 22;
    } else {
      foodTypeScore = 12;
    }

    const totalScore = Math.min(100, distanceScore + capacityFitScore + foodTypeScore);

    return {
      orgId: org.id,
      orgName: org.name,
      category: org.category,
      distanceKm: org.distanceKm,
      distanceScore,
      capacityFitScore,
      foodTypeScore,
      totalScore,
      typicalCapacityMeals: org.typicalCapacityMeals,
      phone: org.phone,
      address: org.address,
      foodTypesAccepted: org.foodTypesAccepted,
    };
  });

  // Sort descending by total score
  return matches.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Transparent Department Leaderboard Sub-score computation (Calculated locally, not by AI)
 * Sub-score 1: Waste reduction vs baseline (0-35 points)
 * Sub-score 2: Prediction accuracy (0-35 points)
 * Sub-score 3: Surplus successfully rescued (0-30 points)
 */
export function computeDepartmentStandings(rawDepts: any[]): DepartmentStanding[] {
  return rawDepts
    .map((dept) => {
      // 1. Waste reduction: ((baseline - recent) / baseline) * 35
      const baseline = dept.baselineWasteMeals || 100;
      const recent = dept.recentWasteMeals || 0;
      const reductionRatio = Math.max(0, (baseline - recent) / baseline);
      const wasteReductionScore = Math.min(35, Math.round(reductionRatio * 35 * 10) / 10);
      const wasteReductionStars = Math.min(5, Math.max(1, Math.round((wasteReductionScore / 35) * 5)));

      // 2. Prediction accuracy: (accuracy / 100) * 35
      const accuracy = dept.predictionAccuracy || 85;
      const predictionAccuracyScore = Math.min(35, Math.round((accuracy / 100) * 35 * 10) / 10);
      const predictionAccuracyStars = Math.min(5, Math.max(1, Math.round((predictionAccuracyScore / 35) * 5)));

      // 3. Surplus rescued: min(30, (rescued / 500) * 30)
      const rescued = dept.surplusRescuedMeals || 0;
      const surplusRescuedScore = Math.min(30, Math.round((rescued / 500) * 30 * 10) / 10);
      const surplusRescuedStars = Math.min(5, Math.max(1, Math.round((surplusRescuedScore / 30) * 5)));

      const totalScore = Math.round((wasteReductionScore + predictionAccuracyScore + surplusRescuedScore) * 10) / 10;

      return {
        id: dept.id,
        name: dept.name,
        baselineWasteMeals: dept.baselineWasteMeals,
        recentWasteMeals: dept.recentWasteMeals,
        predictionAccuracy: dept.predictionAccuracy,
        surplusRescuedMeals: dept.surplusRescuedMeals,
        wasteReductionScore,
        wasteReductionStars,
        predictionAccuracyScore,
        predictionAccuracyStars,
        surplusRescuedScore,
        surplusRescuedStars,
        totalScore,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Prediction Accuracy Trend & Status:
 * Computes slope / average error difference of last 3 logs vs prior 3 logs
 * Returns: "Improving" | "Stable" | "Getting worse" (calculated locally, not guessed by AI)
 */
export function getAccuracyTrendStatus(logs: MealLog[]): {
  status: 'Improving' | 'Stable' | 'Getting worse';
  statusColor: string;
  averageErrorPct: number;
  recentAvg: number;
  priorAvg: number;
  diff: number;
} {
  const enteredLogs = logs.filter((l) => l.actualEntered && typeof l.predictionErrorPct === 'number');
  if (enteredLogs.length < 3) {
    return {
      status: 'Stable',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      averageErrorPct: 1.8,
      recentAvg: 1.8,
      priorAvg: 1.8,
      diff: 0,
    };
  }

  // Sort chronological
  const sorted = [...enteredLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalError = sorted.reduce((acc, l) => acc + l.predictionErrorPct, 0);
  const averageErrorPct = Math.round((totalError / sorted.length) * 100) / 100;

  const half = Math.floor(sorted.length / 2);
  const prior = sorted.slice(0, half);
  const recent = sorted.slice(half);

  const priorAvg = prior.reduce((acc, l) => acc + l.predictionErrorPct, 0) / (prior.length || 1);
  const recentAvg = recent.reduce((acc, l) => acc + l.predictionErrorPct, 0) / (recent.length || 1);
  const diff = Math.round((recentAvg - priorAvg) * 100) / 100;

  // If recent average error is lower than prior average by > 0.4%, it's Improving
  if (diff < -0.4) {
    return {
      status: 'Improving',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      averageErrorPct,
      recentAvg: Math.round(recentAvg * 100) / 100,
      priorAvg: Math.round(priorAvg * 100) / 100,
      diff,
    };
  } else if (diff > 0.4) {
    return {
      status: 'Getting worse',
      statusColor: 'text-rose-700 bg-rose-50 border-rose-200',
      averageErrorPct,
      recentAvg: Math.round(recentAvg * 100) / 100,
      priorAvg: Math.round(priorAvg * 100) / 100,
      diff,
    };
  } else {
    return {
      status: 'Stable',
      statusColor: 'text-blue-700 bg-blue-50 border-blue-200',
      averageErrorPct,
      recentAvg: Math.round(recentAvg * 100) / 100,
      priorAvg: Math.round(priorAvg * 100) / 100,
      diff,
    };
  }
}
