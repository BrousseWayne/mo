interface ProgressEntry {
  minimum_viable_days_count: number | null;
  week_number: number;
}

interface TrainingSession {
  status: string;
  week_number: number;
}

export interface ComplianceReport {
  meal_adherence_pct: number;
  training_adherence_pct: number;
  mvd_avg: number;
  streak_current: number;
  streak_best: number;
}

export function computeCompliance(
  progressEntries: ProgressEntry[],
  trainingSessions: TrainingSession[]
): ComplianceReport {
  const mvdEntries = progressEntries.filter((e) => e.minimum_viable_days_count != null);
  const mvdAvg =
    mvdEntries.length > 0
      ? mvdEntries.reduce((sum, e) => sum + e.minimum_viable_days_count!, 0) / mvdEntries.length
      : 0;
  const mealAdherencePct = mvdEntries.length > 0 ? Math.round((mvdAvg / 7) * 100) : 0;

  const totalSessions = trainingSessions.length;
  const completedSessions = trainingSessions.filter((s) => s.status === "completed").length;
  const trainingAdherencePct =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const sorted = [...progressEntries].sort((a, b) => b.week_number - a.week_number);
  let streakCurrent = 0;
  for (const entry of sorted) {
    if (entry.minimum_viable_days_count != null && entry.minimum_viable_days_count >= 3) {
      streakCurrent++;
    } else {
      break;
    }
  }

  let streakBest = 0;
  let currentRun = 0;
  for (const entry of sorted) {
    if (entry.minimum_viable_days_count != null && entry.minimum_viable_days_count >= 3) {
      currentRun++;
      streakBest = Math.max(streakBest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return {
    meal_adherence_pct: mealAdherencePct,
    training_adherence_pct: trainingAdherencePct,
    mvd_avg: Math.round(mvdAvg * 100) / 100,
    streak_current: streakCurrent,
    streak_best: streakBest,
  };
}
