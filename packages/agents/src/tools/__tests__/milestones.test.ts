import { describe, it, expect } from "vitest";
import { detectNewMilestones } from "../milestones.js";

describe("detectNewMilestones", () => {
  const baseProgram = {
    current_weight_kg: 60,
    target_weight_kg: 65,
  };

  it("detects first_checkin", () => {
    const milestones = detectNewMilestones(
      baseProgram,
      [{ week_number: 1, weight_kg: 56, created_at: new Date() }],
      [],
      []
    );
    expect(milestones.some((m) => m.type === "first_checkin")).toBe(true);
  });

  it("does not duplicate existing milestones", () => {
    const milestones = detectNewMilestones(
      baseProgram,
      [{ week_number: 1, weight_kg: 56, created_at: new Date() }],
      [],
      [{ type: "first_checkin" }]
    );
    expect(milestones.some((m) => m.type === "first_checkin")).toBe(false);
  });

  it("detects weight milestones", () => {
    const entries = [
      { week_number: 1, weight_kg: 55, created_at: new Date() },
      { week_number: 10, weight_kg: 60, created_at: new Date() },
    ];
    const milestones = detectNewMilestones(
      { current_weight_kg: 60, target_weight_kg: 65 },
      entries,
      [],
      [{ type: "first_checkin" }]
    );
    expect(milestones.some((m) => m.type === "first_kg_gained")).toBe(true);
    expect(milestones.some((m) => m.type === "five_kg_milestone" && m.value === 5)).toBe(true);
    expect(milestones.some((m) => m.type === "halfway_to_goal")).toBe(true);
  });

  it("detects training streak", () => {
    const sessions = [1, 2, 3, 4].map((w) => ({
      week_number: w,
      status: "completed",
      exercises: [{ name: "squat", actual: [{ weight_kg: 40, reps: 8 }] }],
    }));
    const milestones = detectNewMilestones(baseProgram, [], sessions, []);
    expect(milestones.some((m) => m.type === "training_streak_4wk")).toBe(true);
    expect(milestones.some((m) => m.type === "first_lift_progression")).toBe(true);
  });

  it("detects compliance streak", () => {
    const entries = [1, 2, 3, 4].map((w) => ({
      week_number: w,
      weight_kg: 56,
      minimum_viable_days_count: 6,
      created_at: new Date(),
    }));
    const milestones = detectNewMilestones(baseProgram, entries, [], [{ type: "first_checkin" }]);
    expect(milestones.some((m) => m.type === "compliance_streak_4wk")).toBe(true);
  });

  it("detects target_reached", () => {
    const milestones = detectNewMilestones(
      { current_weight_kg: 65, target_weight_kg: 65 },
      [{ week_number: 1, weight_kg: 55, created_at: new Date() }],
      [],
      [{ type: "first_checkin" }, { type: "first_kg_gained" }]
    );
    expect(milestones.some((m) => m.type === "target_reached")).toBe(true);
  });

  it("returns empty for no data", () => {
    expect(detectNewMilestones(baseProgram, [], [], [])).toEqual([]);
  });
});
