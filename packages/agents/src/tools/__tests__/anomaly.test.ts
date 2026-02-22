import { describe, it, expect } from "vitest";
import { detectWeightAnomaly, detectMeasurementInconsistency } from "../anomaly.js";

describe("detectWeightAnomaly", () => {
  it("detects large weight jump", () => {
    const weights = [
      { week_number: 1, weight_kg: 55 },
      { week_number: 2, weight_kg: 55.3 },
      { week_number: 3, weight_kg: 57.5 },
    ];
    const result = detectWeightAnomaly(weights);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("weight_jump");
    expect(result[0].week_number).toBe(3);
  });

  it("returns empty for normal progression", () => {
    const weights = [
      { week_number: 1, weight_kg: 55 },
      { week_number: 2, weight_kg: 55.4 },
      { week_number: 3, weight_kg: 55.7 },
    ];
    expect(detectWeightAnomaly(weights)).toEqual([]);
  });
});

describe("detectMeasurementInconsistency", () => {
  it("detects large waist change", () => {
    const measurements = [
      { week_number: 1, waist_cm: 70, hip_cm: 95 },
      { week_number: 2, waist_cm: 74, hip_cm: 95 },
    ];
    const result = detectMeasurementInconsistency(measurements);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("waist_jump");
  });
});
