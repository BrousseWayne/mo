import type { Insight } from "./generators.js";
import {
  detectTrainingPatterns,
  detectCompliancePatterns,
  detectWeightPatterns,
  detectSubjectivePatterns,
} from "./generators.js";

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

export function generateInsights(
  entries: ProgressEntry[],
  sessions: TrainingSession[],
  maxInsights = 5
): Insight[] {
  const insights: Insight[] = [];

  const training = detectTrainingPatterns(sessions);
  if (training) insights.push(training);

  const compliance = detectCompliancePatterns(entries);
  if (compliance) insights.push(compliance);

  const weight = detectWeightPatterns(entries);
  if (weight) insights.push(weight);

  const subjective = detectSubjectivePatterns(entries);
  if (subjective) insights.push(subjective);

  return insights.slice(0, maxInsights);
}
