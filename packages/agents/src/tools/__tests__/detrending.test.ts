import { describe, it, expect } from "vitest";
import { detrendWeight, rollingAverage } from "../detrending.js";

describe("detrendWeight", () => {
  it("removes menstrual phase water retention offset", () => {
    const weights = [
      { week_number: 1, weight_kg: 56.0 },
      { week_number: 2, weight_kg: 56.8 },
    ];
    const cycles = [
      { week_number: 1, cycle_phase: "follicular" },
      { week_number: 2, cycle_phase: "menstrual" },
    ];
    const result = detrendWeight(weights, cycles);
    expect(result[0].weight_kg).toBe(56.0);
    expect(result[1].weight_kg).toBe(56.0);
  });

  it("passes through when no cycle data", () => {
    const weights = [{ week_number: 1, weight_kg: 55 }];
    expect(detrendWeight(weights, [])).toEqual(weights);
  });
});

describe("rollingAverage", () => {
  it("smooths weight data", () => {
    const weights = [
      { week_number: 1, weight_kg: 55 },
      { week_number: 2, weight_kg: 56 },
      { week_number: 3, weight_kg: 55 },
      { week_number: 4, weight_kg: 57 },
      { week_number: 5, weight_kg: 56 },
    ];
    const result = rollingAverage(weights, 3);
    expect(result.length).toBe(5);
    expect(result[2].weight_kg).toBeCloseTo(56, 0);
  });
});
