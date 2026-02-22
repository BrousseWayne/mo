import { describe, it, expect } from "vitest";
import { computeCompliance } from "../compliance.js";

describe("computeCompliance", () => {
  it("returns zeros for empty data", () => {
    const result = computeCompliance([], []);
    expect(result.meal_adherence_pct).toBe(0);
    expect(result.training_adherence_pct).toBe(0);
    expect(result.mvd_avg).toBe(0);
    expect(result.streak_current).toBe(0);
    expect(result.streak_best).toBe(0);
  });

  it("calculates meal adherence from MVD", () => {
    const entries = [
      { minimum_viable_days_count: 5, week_number: 3 },
      { minimum_viable_days_count: 6, week_number: 2 },
      { minimum_viable_days_count: 4, week_number: 1 },
    ];
    const result = computeCompliance(entries, []);
    expect(result.mvd_avg).toBe(5);
    expect(result.meal_adherence_pct).toBe(71);
  });

  it("calculates training adherence", () => {
    const sessions = [
      { status: "completed", week_number: 1 },
      { status: "completed", week_number: 1 },
      { status: "skipped", week_number: 1 },
      { status: "completed", week_number: 2 },
    ];
    const result = computeCompliance([], sessions);
    expect(result.training_adherence_pct).toBe(75);
  });

  it("calculates streaks correctly", () => {
    const entries = [
      { minimum_viable_days_count: 4, week_number: 5 },
      { minimum_viable_days_count: 5, week_number: 4 },
      { minimum_viable_days_count: 1, week_number: 3 },
      { minimum_viable_days_count: 6, week_number: 2 },
      { minimum_viable_days_count: 3, week_number: 1 },
    ];
    const result = computeCompliance(entries, []);
    expect(result.streak_current).toBe(2);
    expect(result.streak_best).toBe(2);
  });

  it("handles null MVD entries", () => {
    const entries = [
      { minimum_viable_days_count: null, week_number: 2 },
      { minimum_viable_days_count: 5, week_number: 1 },
    ];
    const result = computeCompliance(entries, []);
    expect(result.mvd_avg).toBe(5);
  });
});
