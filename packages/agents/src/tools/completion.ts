interface Program {
  current_weight_kg: number;
  target_weight_kg: number;
  started_at?: Date | string | null;
  created_at: Date | string;
}

interface ProgressEntry {
  week_number: number;
  weight_kg: number;
}

interface Milestone {
  type: string;
  value?: number | null;
}

export interface CompletionSummary {
  total_gained_kg: number;
  weeks_on_program: number;
  final_weight_kg: number;
  target_weight_kg: number;
  milestone_count: number;
  start_weight_kg: number;
}

export function checkCompletionCriteria(
  program: Program,
  recentEntries: ProgressEntry[]
): boolean {
  if (program.target_weight_kg <= 0) return false;

  const sorted = [...recentEntries]
    .sort((a, b) => b.week_number - a.week_number)
    .slice(0, 2);

  if (sorted.length < 2) return false;

  return sorted.every(
    (e) => Math.abs(e.weight_kg - program.target_weight_kg) <= 1
  );
}

export function generateCompletionSummary(
  program: Program,
  entries: ProgressEntry[],
  milestones: Milestone[]
): CompletionSummary {
  const sorted = [...entries].sort((a, b) => a.week_number - b.week_number);
  const startWeight = sorted.length > 0 ? sorted[0].weight_kg : program.current_weight_kg;
  const weeksOnProgram = sorted.length > 0 ? sorted[sorted.length - 1].week_number : 0;

  return {
    total_gained_kg: Math.round((program.current_weight_kg - startWeight) * 100) / 100,
    weeks_on_program: weeksOnProgram,
    final_weight_kg: program.current_weight_kg,
    target_weight_kg: program.target_weight_kg,
    milestone_count: milestones.length,
    start_weight_kg: startWeight,
  };
}
