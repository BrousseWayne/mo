interface WeightEntry {
  week_number: number;
  weight_kg: number;
}

interface MeasurementEntry {
  week_number: number;
  waist_cm: number | null;
  hip_cm: number | null;
}

export interface AnomalyResult {
  type: string;
  week_number: number;
  value: number;
  expected_range: [number, number];
  confidence: "low" | "medium" | "high";
}

export function detectWeightAnomaly(weights: WeightEntry[]): AnomalyResult[] {
  if (weights.length < 3) return [];

  const sorted = [...weights].sort((a, b) => a.week_number - b.week_number);
  const anomalies: AnomalyResult[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i].weight_kg - sorted[i - 1].weight_kg);
    if (diff > 1.5) {
      anomalies.push({
        type: "weight_jump",
        week_number: sorted[i].week_number,
        value: diff,
        expected_range: [0, 1.5],
        confidence: diff > 2.5 ? "high" : "medium",
      });
    }
  }

  return anomalies;
}

export function detectMeasurementInconsistency(measurements: MeasurementEntry[]): AnomalyResult[] {
  if (measurements.length < 2) return [];

  const sorted = [...measurements].sort((a, b) => a.week_number - b.week_number);
  const anomalies: AnomalyResult[] = [];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].waist_cm != null && sorted[i - 1].waist_cm != null) {
      const diff = Math.abs(sorted[i].waist_cm! - sorted[i - 1].waist_cm!);
      if (diff > 3) {
        anomalies.push({
          type: "waist_jump",
          week_number: sorted[i].week_number,
          value: diff,
          expected_range: [0, 3],
          confidence: diff > 5 ? "high" : "medium",
        });
      }
    }

    if (sorted[i].hip_cm != null && sorted[i - 1].hip_cm != null) {
      const diff = Math.abs(sorted[i].hip_cm! - sorted[i - 1].hip_cm!);
      if (diff > 3) {
        anomalies.push({
          type: "hip_jump",
          week_number: sorted[i].week_number,
          value: diff,
          expected_range: [0, 3],
          confidence: diff > 5 ? "high" : "medium",
        });
      }
    }
  }

  return anomalies;
}
