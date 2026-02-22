interface WeightEntry {
  week_number: number;
  weight_kg: number;
}

interface CycleEntry {
  week_number: number;
  cycle_phase?: string | null;
}

const PHASE_OFFSETS: Record<string, number> = {
  menstrual: 0.8,
  follicular: 0,
  luteal: 0.5,
};

export function detrendWeight(
  weights: WeightEntry[],
  cyclePhases: CycleEntry[]
): WeightEntry[] {
  if (cyclePhases.length === 0) return weights;

  const phaseMap = new Map<number, string>();
  for (const c of cyclePhases) {
    if (c.cycle_phase) phaseMap.set(c.week_number, c.cycle_phase);
  }

  return weights.map((w) => {
    const phase = phaseMap.get(w.week_number);
    const offset = phase ? (PHASE_OFFSETS[phase] ?? 0) : 0;
    return {
      week_number: w.week_number,
      weight_kg: Math.round((w.weight_kg - offset) * 100) / 100,
    };
  });
}

export function rollingAverage(weights: WeightEntry[], window = 3): WeightEntry[] {
  if (weights.length < window) return weights;

  const sorted = [...weights].sort((a, b) => a.week_number - b.week_number);
  const result: WeightEntry[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(sorted.length, i + Math.ceil(window / 2));
    const slice = sorted.slice(start, end);
    const avg = slice.reduce((sum, w) => sum + w.weight_kg, 0) / slice.length;
    result.push({
      week_number: sorted[i].week_number,
      weight_kg: Math.round(avg * 100) / 100,
    });
  }

  return result;
}
