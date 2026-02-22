interface ProgressEntry {
  week_number: number;
  weight_kg: number;
  subjective_markers?: { energy?: number; sleep_quality?: number; mood?: number; appetite?: number } | null;
}

interface TrainingSession {
  status: string;
  exercises: { name: string; actual?: { weight_kg: number; reps: number }[] }[];
}

interface Milestone {
  type: string;
  value?: number | null;
}

interface Program {
  current_weight_kg: number;
  target_weight_kg: number;
  current_week: number;
}

export function generateWeeklyReport(
  program: Program,
  entries: ProgressEntry[],
  sessions: TrainingSession[],
  milestones: Milestone[]
): string {
  const sections: string[] = [];
  const latest = entries[0];
  const previous = entries[1];

  sections.push(`Week ${program.current_week} Summary`);
  sections.push("---");

  if (latest && previous) {
    const change = latest.weight_kg - previous.weight_kg;
    const direction = change >= 0 ? "+" : "";
    sections.push(`Weight: ${latest.weight_kg}kg (${direction}${change.toFixed(1)}kg from last week)`);
  } else if (latest) {
    sections.push(`Weight: ${latest.weight_kg}kg`);
  }

  const remaining = program.target_weight_kg - program.current_weight_kg;
  if (remaining > 0) {
    sections.push(`${remaining.toFixed(1)}kg remaining to goal (${program.target_weight_kg}kg)`);
  }

  const completed = sessions.filter(s => s.status === "completed").length;
  const total = sessions.length;
  if (total > 0) {
    sections.push(`Training: ${completed}/${total} sessions completed`);
  }

  const progressions: string[] = [];
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    for (const ex of session.exercises) {
      if (ex.actual && ex.actual.length > 0) {
        const best = ex.actual.reduce((a, b) => a.weight_kg > b.weight_kg ? a : b);
        progressions.push(`${ex.name}: ${best.weight_kg}kg × ${best.reps}`);
      }
    }
  }
  if (progressions.length > 0) {
    sections.push(`Strength highlights: ${progressions.slice(0, 3).join(", ")}`);
  }

  if (latest?.subjective_markers) {
    const m = latest.subjective_markers;
    const markers: string[] = [];
    if (m.energy != null) markers.push(`energy ${m.energy}/10`);
    if (m.sleep_quality != null) markers.push(`sleep ${m.sleep_quality}/10`);
    if (m.mood != null) markers.push(`mood ${m.mood}/10`);
    if (markers.length > 0) {
      sections.push(`How you're feeling: ${markers.join(", ")}`);
    }
  }

  if (milestones.length > 0) {
    const names = milestones.map(m => m.type.replace(/_/g, " "));
    sections.push(`Milestones this week: ${names.join(", ")}`);
  }

  return sections.join("\n");
}
