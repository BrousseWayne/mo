import { TRIGGER_THRESHOLDS, ADAPTATION_WEEKS } from "@mo/shared";
import type { TriggerResult } from "@mo/shared";

interface WeightEntry {
  weight_kg: number;
  week_number: number;
}

interface MeasurementEntry {
  waist_cm: number | null;
  hip_cm: number | null;
  week_number: number;
}

interface TrainingSession {
  exercises: {
    name: string;
    actual?: { weight_kg: number; reps: number }[];
  }[];
  status: string;
  week_number: number;
}

export function evaluateInsufficientGain(
  weights: WeightEntry[],
  adaptationComplete: boolean
): TriggerResult | null {
  if (!adaptationComplete || weights.length < 3) return null;

  const recent = weights.slice(0, 3);
  const weeklyGains = recent.slice(0, -1).map((w, i) => w.weight_kg - recent[i + 1].weight_kg);
  const avgGain = weeklyGains.reduce((a, b) => a + b, 0) / weeklyGains.length;

  if (avgGain < TRIGGER_THRESHOLDS.min_weekly_gain) {
    return {
      trigger_type: "insufficient_gain",
      adjustment_kcal: TRIGGER_THRESHOLDS.calorie_increase,
      affected_agents: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"],
      old_values: { avg_weekly_gain_kg: Math.round(avgGain * 100) / 100 },
      new_values: { calorie_increase_kcal: TRIGGER_THRESHOLDS.calorie_increase },
      reason: `Average weekly gain (${(avgGain).toFixed(2)} kg) below minimum threshold (${TRIGGER_THRESHOLDS.min_weekly_gain} kg)`,
    };
  }

  return null;
}

export function evaluateExcessiveGain(
  weights: WeightEntry[],
  adaptationComplete: boolean
): TriggerResult | null {
  if (!adaptationComplete || weights.length < 3) return null;

  const recent = weights.slice(0, 3);
  const weeklyGains = recent.slice(0, -1).map((w, i) => w.weight_kg - recent[i + 1].weight_kg);
  const avgGain = weeklyGains.reduce((a, b) => a + b, 0) / weeklyGains.length;

  if (avgGain > TRIGGER_THRESHOLDS.max_weekly_gain) {
    return {
      trigger_type: "excessive_gain",
      adjustment_kcal: -TRIGGER_THRESHOLDS.calorie_decrease,
      affected_agents: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"],
      old_values: { avg_weekly_gain_kg: Math.round(avgGain * 100) / 100 },
      new_values: { calorie_decrease_kcal: TRIGGER_THRESHOLDS.calorie_decrease },
      reason: `Average weekly gain (${(avgGain).toFixed(2)} kg) exceeds maximum threshold (${TRIGGER_THRESHOLDS.max_weekly_gain} kg)`,
    };
  }

  return null;
}

export function evaluateWaistHipFlag(
  measurements: MeasurementEntry[]
): TriggerResult | null {
  const valid = measurements.filter((m) => m.waist_cm != null && m.hip_cm != null);
  if (valid.length < TRIGGER_THRESHOLDS.waist_hip_weeks) return null;

  const recent = valid.slice(0, TRIGGER_THRESHOLDS.waist_hip_weeks);
  const ratios = recent.map((m) => m.waist_cm! / m.hip_cm!);

  const increasing = ratios.slice(0, -1).every((r, i) => r >= ratios[i + 1]);
  if (!increasing) return null;

  const totalIncrease = ratios[0] - ratios[ratios.length - 1];
  if (totalIncrease > 0.02) {
    return {
      trigger_type: "waist_hip_flag",
      adjustment_kcal: null,
      affected_agents: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"],
      old_values: { waist_hip_ratios: ratios.map((r) => Math.round(r * 1000) / 1000) },
      new_values: {},
      reason: `Waist-hip ratio increasing over ${TRIGGER_THRESHOLDS.waist_hip_weeks} consecutive weeks (${totalIncrease.toFixed(3)} increase)`,
    };
  }

  return null;
}

export function evaluateTrainingStall(
  sessions: TrainingSession[]
): TriggerResult | null {
  if (sessions.length < TRIGGER_THRESHOLDS.stall_sessions) return null;

  const completed = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.week_number - a.week_number);

  if (completed.length < TRIGGER_THRESHOLDS.stall_sessions) return null;

  const recent = completed.slice(0, TRIGGER_THRESHOLDS.stall_sessions);

  const exerciseMaxes = new Map<string, number[]>();
  for (const session of recent) {
    for (const ex of session.exercises) {
      if (!ex.actual?.length) continue;
      const maxLoad = Math.max(...ex.actual.map((s) => s.weight_kg * s.reps));
      const existing = exerciseMaxes.get(ex.name) ?? [];
      existing.push(maxLoad);
      exerciseMaxes.set(ex.name, existing);
    }
  }

  let stalledLifts = 0;
  for (const [, loads] of exerciseMaxes) {
    if (loads.length < TRIGGER_THRESHOLDS.stall_sessions) continue;
    const isStalled = loads.every((l) => Math.abs(l - loads[0]) < 0.01);
    if (isStalled) stalledLifts++;
  }

  if (stalledLifts >= TRIGGER_THRESHOLDS.stall_lifts) {
    return {
      trigger_type: "training_stall",
      adjustment_kcal: null,
      affected_agents: ["COACH"],
      old_values: { stalled_lifts: stalledLifts },
      new_values: {},
      reason: `${stalledLifts} exercises stalled across ${TRIGGER_THRESHOLDS.stall_sessions} consecutive sessions`,
    };
  }

  return null;
}

export function evaluateWeightMilestone(
  startWeight: number,
  currentWeight: number,
  lastRecalcWeight: number | null
): TriggerResult | null {
  const interval = TRIGGER_THRESHOLDS.milestone_interval_kg;
  const gained = currentWeight - startWeight;
  const lastRecalcGained = (lastRecalcWeight ?? startWeight) - startWeight;

  const currentMilestone = Math.floor(gained / interval);
  const lastMilestone = Math.floor(lastRecalcGained / interval);

  if (currentMilestone > lastMilestone && currentMilestone > 0) {
    return {
      trigger_type: "weight_milestone",
      adjustment_kcal: null,
      affected_agents: ["SCIENTIST", "NUTRITIONIST"],
      old_values: { last_recalc_weight_kg: lastRecalcWeight ?? startWeight },
      new_values: { milestone_kg: currentMilestone * interval },
      reason: `Reached ${currentMilestone * interval} kg milestone — TDEE recalculation needed`,
    };
  }

  return null;
}

export function evaluateProteinRecalc(
  lastRecalcDate: Date | null,
  now: Date
): TriggerResult | null {
  if (!lastRecalcDate) return null;

  const daysSince = (now.getTime() - lastRecalcDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince >= TRIGGER_THRESHOLDS.protein_recalc_days) {
    return {
      trigger_type: "protein_recalc",
      adjustment_kcal: null,
      affected_agents: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"],
      old_values: { last_recalc_date: lastRecalcDate.toISOString() },
      new_values: { days_since_recalc: Math.floor(daysSince) },
      reason: `${Math.floor(daysSince)} days since last protein recalculation (threshold: ${TRIGGER_THRESHOLDS.protein_recalc_days})`,
    };
  }

  return null;
}

export function evaluateCompliance(
  mvdCounts: number[]
): TriggerResult | null {
  if (mvdCounts.length < 3) return null;

  const recent = mvdCounts.slice(0, 3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  if (avg < TRIGGER_THRESHOLDS.compliance_mvd_threshold) {
    return {
      trigger_type: "compliance",
      adjustment_kcal: null,
      affected_agents: ["DIETITIAN", "CHEF"],
      old_values: { avg_mvd: Math.round(avg * 100) / 100 },
      new_values: {},
      reason: `Average minimum viable days (${avg.toFixed(1)}) below threshold (${TRIGGER_THRESHOLDS.compliance_mvd_threshold}). Meal plan simplification needed`,
    };
  }

  return null;
}
