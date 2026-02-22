import { describe, it, expect } from "vitest";
import { projectTrajectory, getTrajectoryDeviation } from "../trajectory.js";

describe("projectTrajectory", () => {
  it("projects future weight based on trend", () => {
    const weights = [
      { week_number: 1, weight_kg: 55 },
      { week_number: 2, weight_kg: 55.5 },
      { week_number: 3, weight_kg: 56 },
      { week_number: 4, weight_kg: 56.5 },
    ];
    const result = projectTrajectory(weights, 65, 20);
    expect(result.current_rate_kg_per_week).toBeCloseTo(0.5, 1);
    expect(result.weeks_to_goal).toBe(17);
    expect(result.projected_weeks.length).toBe(20);
  });

  it("returns null weeks_to_goal for no gain", () => {
    const weights = [
      { week_number: 1, weight_kg: 55 },
      { week_number: 2, weight_kg: 55 },
    ];
    const result = projectTrajectory(weights, 65);
    expect(result.weeks_to_goal).toBeNull();
  });
});

describe("getTrajectoryDeviation", () => {
  it("computes deviation between projected and actual", () => {
    const projected = [
      { week_number: 5, weight_kg: 57 },
      { week_number: 6, weight_kg: 57.5 },
    ];
    const actual = [
      { week_number: 5, weight_kg: 56.8 },
      { week_number: 6, weight_kg: 57.2 },
    ];
    const result = getTrajectoryDeviation(projected, actual);
    expect(result[0].deviation_kg).toBeCloseTo(-0.2, 1);
    expect(result[1].deviation_kg).toBeCloseTo(-0.3, 1);
  });
});
