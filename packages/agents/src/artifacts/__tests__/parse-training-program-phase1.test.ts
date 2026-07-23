import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseTrainingProgram } from "../parse-training-program.js";
import { generateWeekSessions } from "../../training/generate-week.js";

const md = readFileSync(
  fileURLToPath(new URL("../../../../../agents/artifacts/coach-training-program-phase1.md", import.meta.url)),
  "utf-8"
);

describe("parseTrainingProgram (phase 1 artifact)", () => {
  const output = parseTrainingProgram(md);

  it("parses the program header", () => {
    expect(output.program.phase).toBe("phase_1");
    expect(output.program.phase_week).toBe(1);
    expect(output.program.frequency).toBe("3x/week full body");
    expect(output.program.total_weeks_remaining_in_phase).toBe(14);
  });

  it("parses 3 sessions of 5 exercises each", () => {
    expect(output.program.sessions.map((s) => s.day)).toEqual(["monday", "wednesday", "friday"]);
    for (const session of output.program.sessions) {
      expect(session.exercises).toHaveLength(5);
    }
  });

  it("declares a double progression rule with increment on every exercise", () => {
    for (const session of output.program.sessions) {
      for (const exercise of session.exercises) {
        expect(exercise.progression_rule).toMatch(/^double_progression_[\d.]+kg$/);
      }
    }
  });

  it("keeps compounds at RPE 7 and isolation at RPE 8", () => {
    const rpes = output.program.sessions.flatMap((s) => s.exercises.map((e) => e.target_rpe));
    expect(Math.min(...rpes)).toBe(7);
    expect(Math.max(...rpes)).toBe(8);
  });

  it("supports double progression from logged actuals", () => {
    const [monday] = generateWeekSessions(output, [
      {
        day_of_week: "monday",
        status: "completed",
        exercises: [
          {
            name: "Barbell Hip Thrust",
            actual: [
              { weight_kg: 20, reps: 15 },
              { weight_kg: 20, reps: 15 },
              { weight_kg: 20, reps: 15 },
            ],
          },
        ],
      },
    ]);
    expect(monday.exercises[0].name).toBe("Barbell Hip Thrust");
    expect(monday.exercises[0].target_weight_kg).toBe(22.5);
  });
});
