import type { TriggerResult } from "@mo/shared";
import { ADAPTATION_WEEKS } from "@mo/shared";
import {
  evaluateInsufficientGain,
  evaluateExcessiveGain,
  evaluateWaistHipFlag,
  evaluateTrainingStall,
  evaluateWeightMilestone,
  evaluateProteinRecalc,
  evaluateCompliance,
} from "./evaluators.js";

interface Program {
  current_week: number;
  current_weight_kg: number;
  target_weight_kg: number;
  last_recalc_weight_kg: number | null;
  last_protein_recalc_at: Date | null;
  started_at: Date;
}

interface WeightEntry {
  weight_kg: number;
  week_number: number;
}

interface MeasurementEntry {
  waist_cm: number | null;
  hip_cm: number | null;
  week_number: number;
}

interface ProgressEntry extends WeightEntry, MeasurementEntry {
  minimum_viable_days_count: number | null;
}

interface TrainingSession {
  exercises: {
    name: string;
    actual?: { weight_kg: number; reps: number }[];
  }[];
  status: string;
  week_number: number;
}

const TRIGGER_PRIORITY: string[] = [
  "waist_hip_flag",
  "insufficient_gain",
  "excessive_gain",
  "weight_milestone",
  "protein_recalc",
  "training_stall",
  "compliance",
];

export function evaluateAllTriggers(
  program: Program,
  recentProgress: ProgressEntry[],
  trainingSessions: TrainingSession[]
): TriggerResult[] {
  const adaptationComplete = program.current_week > ADAPTATION_WEEKS;
  const startWeight = program.target_weight_kg - (program.target_weight_kg - program.current_weight_kg);

  const weights: WeightEntry[] = recentProgress.map((p) => ({
    weight_kg: p.weight_kg,
    week_number: p.week_number,
  }));

  const measurements: MeasurementEntry[] = recentProgress.map((p) => ({
    waist_cm: p.waist_cm,
    hip_cm: p.hip_cm,
    week_number: p.week_number,
  }));

  const mvdCounts = recentProgress
    .filter((p) => p.minimum_viable_days_count != null)
    .map((p) => p.minimum_viable_days_count!);

  const results: TriggerResult[] = [];

  const waistHip = evaluateWaistHipFlag(measurements);
  if (waistHip) results.push(waistHip);

  const insufficientGain = evaluateInsufficientGain(weights, adaptationComplete);
  if (insufficientGain) results.push(insufficientGain);

  const excessiveGain = evaluateExcessiveGain(weights, adaptationComplete);
  if (excessiveGain) results.push(excessiveGain);

  const milestone = evaluateWeightMilestone(
    startWeight,
    program.current_weight_kg,
    program.last_recalc_weight_kg
  );
  if (milestone) results.push(milestone);

  const proteinRecalc = evaluateProteinRecalc(
    program.last_protein_recalc_at,
    new Date()
  );
  if (proteinRecalc) results.push(proteinRecalc);

  const trainingStall = evaluateTrainingStall(trainingSessions);
  if (trainingStall) results.push(trainingStall);

  const compliance = evaluateCompliance(mvdCounts);
  if (compliance) results.push(compliance);

  const hasInsufficientGain = results.some((r) => r.trigger_type === "insufficient_gain");
  const hasExcessiveGain = results.some((r) => r.trigger_type === "excessive_gain");
  if (hasInsufficientGain && hasExcessiveGain) {
    const idx = results.findIndex((r) => r.trigger_type === "excessive_gain");
    if (idx !== -1) results.splice(idx, 1);
  }

  results.sort((a, b) => {
    const aIdx = TRIGGER_PRIORITY.indexOf(a.trigger_type);
    const bIdx = TRIGGER_PRIORITY.indexOf(b.trigger_type);
    return aIdx - bIdx;
  });

  return results;
}
