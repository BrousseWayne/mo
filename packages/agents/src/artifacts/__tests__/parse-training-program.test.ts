import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseTrainingProgram } from "../parse-training-program.js";

const md = readFileSync(
  fileURLToPath(new URL("../../../../../agents/artifacts/coach-training-program.md", import.meta.url)),
  "utf-8"
);

describe("parseTrainingProgram", () => {
  const output = parseTrainingProgram(md);

  it("parses the program header", () => {
    expect(output.program.phase).toBe("phase_0");
    expect(output.program.phase_week).toBe(1);
    expect(output.program.frequency).toBe("3x/week full body");
    expect(output.program.total_weeks_remaining_in_phase).toBe(2);
  });

  it("parses 3 sessions on monday, wednesday, friday", () => {
    expect(output.program.sessions.map((s) => s.day)).toEqual([
      "monday",
      "wednesday",
      "friday",
    ]);
    for (const session of output.program.sessions) {
      expect(session.focus).toBeTruthy();
      expect(session.warmup.length).toBeGreaterThanOrEqual(3);
      expect(session.exercises).toHaveLength(5);
    }
  });

  it("keeps every exercise within phase 0 rules", () => {
    for (const session of output.program.sessions) {
      for (const exercise of session.exercises) {
        expect(exercise.target_rpe).toBeLessThanOrEqual(6);
        expect(exercise.progression_rule).toBe("form_mastery");
        expect(exercise.sets).toBe(2);
        expect(exercise.rest_sec).toBeGreaterThanOrEqual(60);
        expect(exercise.notes).toBeTruthy();
      }
    }
  });

  it("parses full exercise rows", () => {
    const first = output.program.sessions[0].exercises[0];
    expect(first).toMatchObject({
      name: "Bodyweight Glute Bridge",
      sets: 2,
      reps: "15",
      rest_sec: 60,
      target_rpe: 5,
    });
  });

  it("parses rules, recovery, and transition criteria", () => {
    expect(output.progression_rules.length).toBeGreaterThanOrEqual(3);
    expect(output.recovery_protocol.length).toBeGreaterThanOrEqual(3);
    expect(output.phase_transition_criteria).toHaveLength(6);
    expect(output.session_notes).toContain("Phase 0");
  });

  it("parses the weekly volume summary", () => {
    expect(output.weekly_volume_summary.glutes).toBe("8 sets");
    expect(Object.keys(output.weekly_volume_summary)).toHaveLength(7);
  });

  it("contains no banned terminology", () => {
    const banned = [
      "ectomorph",
      "mesomorph",
      "endomorph",
      "somatotype",
      "fast metabolism",
      "slow metabolism",
      "anabolic window",
      "toning",
      "spot reduction",
      "starvation mode",
    ];
    const text = md.toLowerCase();
    for (const term of banned) {
      expect(text).not.toContain(term);
    }
  });
});
