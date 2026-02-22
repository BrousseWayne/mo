interface WeightEntry {
  week_number: number;
  weight_kg: number;
}

export interface TrajectoryProjection {
  projected_weeks: { week_number: number; weight_kg: number }[];
  weeks_to_goal: number | null;
  current_rate_kg_per_week: number;
}

export function projectTrajectory(
  weights: WeightEntry[],
  targetWeight: number,
  weeksAhead = 12
): TrajectoryProjection {
  if (weights.length < 2) {
    return { projected_weeks: [], weeks_to_goal: null, current_rate_kg_per_week: 0 };
  }

  const sorted = [...weights].sort((a, b) => a.week_number - b.week_number);
  const recent = sorted.slice(-4);

  const rates: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const weekDiff = recent[i].week_number - recent[i - 1].week_number;
    if (weekDiff > 0) {
      rates.push((recent[i].weight_kg - recent[i - 1].weight_kg) / weekDiff);
    }
  }

  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const lastEntry = sorted[sorted.length - 1];
  const projected: { week_number: number; weight_kg: number }[] = [];

  let weeksToGoal: number | null = null;

  for (let w = 1; w <= weeksAhead; w++) {
    const projectedWeight = Math.round((lastEntry.weight_kg + avgRate * w) * 100) / 100;
    projected.push({ week_number: lastEntry.week_number + w, weight_kg: projectedWeight });

    if (weeksToGoal === null && avgRate > 0 && projectedWeight >= targetWeight) {
      weeksToGoal = w;
    }
  }

  if (weeksToGoal === null && avgRate > 0) {
    const remaining = targetWeight - lastEntry.weight_kg;
    weeksToGoal = Math.ceil(remaining / avgRate);
  }

  return {
    projected_weeks: projected,
    weeks_to_goal: weeksToGoal,
    current_rate_kg_per_week: Math.round(avgRate * 1000) / 1000,
  };
}

export function getTrajectoryDeviation(
  projected: { week_number: number; weight_kg: number }[],
  actual: WeightEntry[]
): { week_number: number; projected_kg: number; actual_kg: number; deviation_kg: number }[] {
  const actualMap = new Map(actual.map((a) => [a.week_number, a.weight_kg]));

  return projected
    .filter((p) => actualMap.has(p.week_number))
    .map((p) => ({
      week_number: p.week_number,
      projected_kg: p.weight_kg,
      actual_kg: actualMap.get(p.week_number)!,
      deviation_kg: Math.round((actualMap.get(p.week_number)! - p.weight_kg) * 100) / 100,
    }));
}
