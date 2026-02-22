interface Program {
  current_weight_kg: number;
  target_weight_kg: number;
  status: string;
}

interface ProgressEntry {
  weight_kg: number;
  created_at: Date | string;
}

export function generateReengagementPrompt(
  program: Program,
  lastEntry: ProgressEntry | null,
  daysSinceLastCheckin: number
): string | null {
  if (daysSinceLastCheckin < 10) return null;
  if (program.status !== "active") return null;

  const parts: string[] = [];

  if (daysSinceLastCheckin <= 14) {
    parts.push("It's been a little while since your last check-in.");
  } else if (daysSinceLastCheckin <= 30) {
    parts.push(`It's been ${daysSinceLastCheckin} days since your last check-in.`);
  } else {
    parts.push("It's been a while — no pressure, just checking in.");
  }

  if (lastEntry) {
    const weightDiff = program.current_weight_kg - lastEntry.weight_kg;
    if (Math.abs(weightDiff) > 0.1) {
      const direction = weightDiff > 0 ? "up" : "down";
      parts.push(`Last time you weighed in at ${lastEntry.weight_kg}kg (${direction} ${Math.abs(weightDiff).toFixed(1)}kg from your previous).`);
    }
  }

  const remaining = program.target_weight_kg - program.current_weight_kg;
  if (remaining > 0) {
    parts.push(`You're ${remaining.toFixed(1)}kg from your goal of ${program.target_weight_kg}kg.`);
  }

  parts.push("Your plan is ready whenever you are — just submit a quick check-in to pick up where you left off.");

  return parts.join(" ");
}
