import { describe, it, expect } from "vitest";
import { evaluateAllTriggers } from "../../triggers/engine.js";
import { detectNewMilestones } from "../../tools/milestones.js";
import { computeCompliance } from "../../tools/compliance.js";
import { generateInsights } from "../../insights/engine.js";

describe("E2E: full check-in flow (unit-level)", () => {
  const program = {
    current_weight_kg: 57,
    target_weight_kg: 65,
    started_at: new Date("2026-01-01"),
    current_week: 6,
    target_intake_kcal: 2400,
    surplus_kcal: 300,
    current_tier: "tier_0",
    current_phase: "phase_0",
    last_recalc_weight_kg: 55,
    last_protein_recalc_at: new Date("2026-01-01"),
  };

  const entries = [
    { week_number: 1, weight_kg: 55, waist_cm: null, hip_cm: null, minimum_viable_days_count: 5 },
    { week_number: 2, weight_kg: 55.3, waist_cm: null, hip_cm: null, minimum_viable_days_count: 6 },
    { week_number: 3, weight_kg: 55.6, waist_cm: null, hip_cm: null, minimum_viable_days_count: 5 },
    { week_number: 4, weight_kg: 56, waist_cm: null, hip_cm: null, minimum_viable_days_count: 4 },
    { week_number: 5, weight_kg: 56.5, waist_cm: null, hip_cm: null, minimum_viable_days_count: 6 },
    { week_number: 6, weight_kg: 57, waist_cm: null, hip_cm: null, minimum_viable_days_count: 5 },
  ];

  const sessions = [
    { week_number: 4, status: "completed", day_of_week: "monday", focus: "lower", exercises: [{ name: "squat", progressed: true }] },
    { week_number: 5, status: "completed", day_of_week: "wednesday", focus: "upper", exercises: [{ name: "squat", progressed: true }] },
    { week_number: 6, status: "completed", day_of_week: "friday", focus: "full", exercises: [{ name: "squat", progressed: true }] },
  ];

  it("evaluates triggers on a healthy progression", () => {
    const triggers = evaluateAllTriggers(program, entries, sessions);
    expect(Array.isArray(triggers)).toBe(true);
  });

  it("detects milestones on gaining 2kg", () => {
    const milestoneEntries = entries.map(e => ({
      week_number: e.week_number,
      weight_kg: e.weight_kg,
      created_at: new Date("2026-01-01"),
    }));
    const milestoneSessions = sessions.map(s => ({
      week_number: s.week_number,
      status: s.status,
    }));
    const milestones = detectNewMilestones(program, milestoneEntries, milestoneSessions, []);
    expect(milestones.some(m => m.type === "first_kg_gained")).toBe(true);
  });

  it("computes compliance from entries and sessions", () => {
    const complianceEntries = entries.map(e => ({
      week_number: e.week_number,
      minimum_viable_days_count: e.minimum_viable_days_count as number | null,
    }));
    const complianceSessions = sessions.map(s => ({
      week_number: s.week_number,
      status: s.status,
    }));
    const compliance = computeCompliance(complianceEntries, complianceSessions);
    expect(compliance.training_adherence_pct).toBeGreaterThan(0);
    expect(compliance.mvd_avg).toBeGreaterThan(0);
  });

  it("generates insights from progress data", () => {
    const insightEntries = entries.map(e => ({
      week_number: e.week_number,
      weight_kg: e.weight_kg,
      minimum_viable_days_count: e.minimum_viable_days_count as number | null,
    }));
    const insightSessions = sessions.map(s => ({
      week_number: s.week_number,
      day_of_week: s.day_of_week,
      status: s.status,
    }));
    const insights = generateInsights(insightEntries, insightSessions);
    expect(Array.isArray(insights)).toBe(true);
  });
});
