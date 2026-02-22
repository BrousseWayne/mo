export interface Insight {
  type: string;
  message: string;
  data_points: Record<string, unknown>[];
  actionable_suggestion?: string;
}

interface ProgressEntry {
  week_number: number;
  weight_kg: number;
  minimum_viable_days_count?: number | null;
  subjective_markers?: { energy?: number; sleep_quality?: number; mood?: number; appetite?: number } | null;
}

interface TrainingSession {
  week_number: number;
  day_of_week: string;
  status: string;
  exercises?: unknown;
}

export function detectTrainingPatterns(sessions: TrainingSession[]): Insight | null {
  if (sessions.length < 4) return null;

  const skipped = sessions.filter((s) => s.status === "skipped");
  if (skipped.length === 0) return null;

  const dayCount = new Map<string, number>();
  for (const s of skipped) {
    dayCount.set(s.day_of_week, (dayCount.get(s.day_of_week) ?? 0) + 1);
  }

  const mostSkipped = [...dayCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (mostSkipped && mostSkipped[1] >= 2) {
    return {
      type: "training_skip_pattern",
      message: `${mostSkipped[0]} is the most frequently skipped training day (${mostSkipped[1]} times).`,
      data_points: skipped.map((s) => ({ week: s.week_number, day: s.day_of_week })),
      actionable_suggestion: `Consider rescheduling ${mostSkipped[0]} sessions to a more convenient day.`,
    };
  }

  return null;
}

export function detectCompliancePatterns(entries: ProgressEntry[]): Insight | null {
  if (entries.length < 3) return null;

  const sorted = [...entries].sort((a, b) => a.week_number - b.week_number);
  const mvds = sorted.map((e) => e.minimum_viable_days_count ?? 0);

  let declining = 0;
  for (let i = 1; i < mvds.length; i++) {
    if (mvds[i] < mvds[i - 1]) declining++;
  }

  if (declining >= Math.floor(mvds.length * 0.6)) {
    return {
      type: "compliance_declining",
      message: "Meal compliance has been declining over recent weeks.",
      data_points: sorted.map((e) => ({ week: e.week_number, mvd: e.minimum_viable_days_count })),
      actionable_suggestion: "Consider simplifying meal prep or reviewing if the current plan is sustainable.",
    };
  }

  return null;
}

export function detectWeightPatterns(entries: ProgressEntry[]): Insight | null {
  if (entries.length < 4) return null;

  const sorted = [...entries].sort((a, b) => a.week_number - b.week_number);
  const weights = sorted.map((e) => e.weight_kg);

  let plateau = 0;
  for (let i = 1; i < weights.length; i++) {
    if (Math.abs(weights[i] - weights[i - 1]) < 0.2) {
      plateau++;
    } else {
      plateau = 0;
    }
  }

  if (plateau >= 3) {
    return {
      type: "weight_plateau",
      message: `Weight has been stable for ${plateau + 1} consecutive weeks.`,
      data_points: sorted.slice(-plateau - 1).map((e) => ({ week: e.week_number, weight: e.weight_kg })),
      actionable_suggestion: "A calorie adjustment may be needed to resume progress.",
    };
  }

  const recentChanges = weights.slice(-3).map((w, i, arr) => (i > 0 ? w - arr[i - 1] : 0)).slice(1);
  const accelerating = recentChanges.every((c) => c > 0.5);
  if (accelerating) {
    return {
      type: "weight_accelerating",
      message: "Weight gain has accelerated in recent weeks.",
      data_points: sorted.slice(-3).map((e) => ({ week: e.week_number, weight: e.weight_kg })),
    };
  }

  return null;
}

export function detectSubjectivePatterns(entries: ProgressEntry[]): Insight | null {
  if (entries.length < 3) return null;

  const sorted = [...entries].sort((a, b) => a.week_number - b.week_number);
  const withMarkers = sorted.filter((e) => e.subjective_markers);
  if (withMarkers.length < 3) return null;

  const energyValues = withMarkers.map((e) => e.subjective_markers!.energy).filter((v): v is number => v !== undefined);
  if (energyValues.length >= 3) {
    const avg = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
    if (avg < 4) {
      return {
        type: "low_energy_trend",
        message: `Average energy level is ${avg.toFixed(1)}/10 over the last ${energyValues.length} weeks.`,
        data_points: withMarkers.map((e) => ({ week: e.week_number, energy: e.subjective_markers!.energy })),
        actionable_suggestion: "Review sleep quality, caloric intake, and recovery protocols.",
      };
    }
  }

  return null;
}
