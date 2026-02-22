export interface Milestone {
  type: string;
  value?: number;
  achieved_at: string;
  metadata?: Record<string, unknown>;
}

interface Program {
  current_weight_kg: number;
  target_weight_kg: number;
  current_phase?: string | null;
  current_tier?: string | null;
  started_at?: Date | string | null;
}

interface ProgressEntry {
  week_number: number;
  weight_kg: number;
  minimum_viable_days_count?: number | null;
  created_at: Date | string;
}

interface TrainingSession {
  week_number: number;
  status: string;
  exercises?: unknown;
}

interface ExistingMilestone {
  type: string;
  value?: number | null;
}

export function detectNewMilestones(
  program: Program,
  entries: ProgressEntry[],
  sessions: TrainingSession[],
  existing: ExistingMilestone[]
): Milestone[] {
  const now = new Date().toISOString();
  const found: Milestone[] = [];
  const has = (type: string, value?: number) =>
    existing.some((m) => m.type === type && (value === undefined || m.value === value));

  if (entries.length >= 1 && !has("first_checkin")) {
    found.push({ type: "first_checkin", achieved_at: now });
  }

  const sorted = [...entries].sort((a, b) => a.week_number - b.week_number);
  const startWeight = sorted.length > 0 ? sorted[0].weight_kg : program.current_weight_kg;
  const currentWeight = program.current_weight_kg;
  const gained = currentWeight - startWeight;

  if (gained >= 1 && !has("first_kg_gained")) {
    found.push({ type: "first_kg_gained", value: 1, achieved_at: now });
  }

  const milestoneInterval = 5;
  for (let kg = milestoneInterval; kg <= gained; kg += milestoneInterval) {
    if (!has("five_kg_milestone", kg)) {
      found.push({ type: "five_kg_milestone", value: kg, achieved_at: now });
    }
  }

  if (program.target_weight_kg > 0) {
    const totalToGain = program.target_weight_kg - startWeight;
    if (totalToGain > 0 && gained >= totalToGain / 2 && !has("halfway_to_goal")) {
      found.push({ type: "halfway_to_goal", value: Math.round(gained * 10) / 10, achieved_at: now });
    }
    if (currentWeight >= program.target_weight_kg && !has("target_reached")) {
      found.push({ type: "target_reached", value: currentWeight, achieved_at: now });
    }
  }

  const completedSessions = sessions.filter((s) => s.status === "completed");
  if (completedSessions.length > 0) {
    const hasProgression = completedSessions.some((s) => {
      const exercises = s.exercises as any[];
      if (!Array.isArray(exercises)) return false;
      return exercises.some((e) => e.actual?.length > 0);
    });
    if (hasProgression && !has("first_lift_progression")) {
      found.push({ type: "first_lift_progression", achieved_at: now });
    }
  }

  const weekSet = new Set<number>();
  for (const s of completedSessions) weekSet.add(s.week_number);
  const sortedWeeks = [...weekSet].sort((a, b) => a - b);
  let streak = 0;
  let maxStreak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (i === 0 || sortedWeeks[i] === sortedWeeks[i - 1] + 1) {
      streak++;
    } else {
      streak = 1;
    }
    maxStreak = Math.max(maxStreak, streak);
  }
  if (maxStreak >= 4 && !has("training_streak_4wk")) {
    found.push({ type: "training_streak_4wk", value: maxStreak, achieved_at: now });
  }

  const weeklyMvd = new Map<number, number>();
  for (const e of entries) {
    weeklyMvd.set(e.week_number, e.minimum_viable_days_count ?? 0);
  }
  const mvdWeeks = [...weeklyMvd.entries()].sort((a, b) => a[0] - b[0]);
  let complianceStreak = 0;
  let maxComplianceStreak = 0;
  for (const [, mvd] of mvdWeeks) {
    if (mvd >= 5) {
      complianceStreak++;
    } else {
      complianceStreak = 0;
    }
    maxComplianceStreak = Math.max(maxComplianceStreak, complianceStreak);
  }
  if (maxComplianceStreak >= 4 && !has("compliance_streak_4wk")) {
    found.push({ type: "compliance_streak_4wk", value: maxComplianceStreak, achieved_at: now });
  }

  return found;
}
