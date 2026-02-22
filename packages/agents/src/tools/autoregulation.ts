interface WarmupData {
  exercise_name: string;
  warmup_weight_kg: number;
  warmup_reps: number;
  warmup_rpe: number;
}

interface RecoveryState {
  sleep_quality?: number;
  soreness?: number;
  energy?: number;
}

interface PrescribedSet {
  weight_kg: number;
  reps: string;
  target_rpe: number;
}

interface AdjustedTarget {
  exercise_name: string;
  original_weight_kg: number;
  adjusted_weight_kg: number;
  adjustment_pct: number;
  reason: string;
}

export function autoregulateSession(
  warmupData: WarmupData[],
  recoveryState: RecoveryState,
  prescribedSets: Record<string, PrescribedSet>
): AdjustedTarget[] {
  const results: AdjustedTarget[] = [];

  let globalModifier = 0;
  if (recoveryState.sleep_quality != null && recoveryState.sleep_quality < 4) {
    globalModifier -= 5;
  }
  if (recoveryState.soreness != null && recoveryState.soreness >= 7) {
    globalModifier -= 5;
  }
  if (recoveryState.energy != null && recoveryState.energy < 4) {
    globalModifier -= 5;
  }

  for (const warmup of warmupData) {
    const prescribed = prescribedSets[warmup.exercise_name];
    if (!prescribed) continue;

    let adjustmentPct = globalModifier;
    const reasons: string[] = [];

    if (warmup.warmup_rpe >= 8) {
      adjustmentPct -= 10;
      reasons.push("warmup felt heavy");
    } else if (warmup.warmup_rpe <= 5) {
      adjustmentPct += 5;
      reasons.push("warmup felt light");
    }

    if (globalModifier < 0) {
      reasons.push("recovery below optimal");
    }

    const adjustedWeight = Math.round(prescribed.weight_kg * (1 + adjustmentPct / 100) * 2) / 2;

    results.push({
      exercise_name: warmup.exercise_name,
      original_weight_kg: prescribed.weight_kg,
      adjusted_weight_kg: Math.max(adjustedWeight, 0),
      adjustment_pct: adjustmentPct,
      reason: reasons.length > 0 ? reasons.join("; ") : "no adjustment needed",
    });
  }

  return results;
}
