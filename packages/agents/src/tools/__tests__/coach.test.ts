import { describe, test, expect } from "vitest";
import {
  assignPhase,
  calculateWeeklyVolume,
  checkProgressiveOverload,
  scheduleDeload,
} from "../coach.js";

describe("assignPhase", () => {
  test("weeks=0, exp='none' → phase_0", () => {
    const result = assignPhase({
      weeks_on_program: 0,
      training_experience: "none",
    });
    expect(result.phase).toBe("phase_0");
    expect(result.phase_week).toBe(0);
  });

  test("weeks=1, exp='none' → phase_0", () => {
    const result = assignPhase({
      weeks_on_program: 1,
      training_experience: "none",
    });
    expect(result.phase).toBe("phase_0");
    expect(result.phase_week).toBe(1);
  });

  test("weeks=5, exp='beginner' → phase_1", () => {
    const result = assignPhase({
      weeks_on_program: 5,
      training_experience: "beginner",
    });
    expect(result.phase).toBe("phase_1");
    expect(result.phase_week).toBe(2);
  });

  test("weeks=17 → phase_2", () => {
    const result = assignPhase({
      weeks_on_program: 17,
      training_experience: "none",
    });
    expect(result.phase).toBe("phase_2");
    expect(result.phase_week).toBe(0);
  });

  test("stall>=3 → phase_2", () => {
    const result = assignPhase({
      weeks_on_program: 10,
      training_experience: "none",
      consecutive_stall_sessions: 3,
    });
    expect(result.phase).toBe("phase_2");
    expect(result.rationale).toContain("stall");
  });
});

describe("calculateWeeklyVolume", () => {
  test("3 exercises with muscle groups → correct sums", () => {
    const result = calculateWeeklyVolume({
      exercises: [
        { name: "Hip Thrust", muscle_groups: ["gluteus_maximus"], sets: 3 },
        { name: "Squat", muscle_groups: ["gluteus_maximus", "quadriceps"], sets: 3 },
        { name: "RDL", muscle_groups: ["hamstrings", "gluteus_maximus"], sets: 3 },
      ],
    });
    expect(result.gluteus_maximus).toBe(9);
    expect(result.quadriceps).toBe(3);
    expect(result.hamstrings).toBe(3);
  });

  test("overlapping muscle groups counted once per exercise", () => {
    const result = calculateWeeklyVolume({
      exercises: [
        { name: "Hip Thrust", muscle_groups: ["gluteus_maximus"], sets: 3 },
        { name: "Side-lying Abduction", muscle_groups: ["gluteus_medius"], sets: 2 },
        { name: "Banded Lateral Walk", muscle_groups: ["gluteus_medius"], sets: 2 },
      ],
    });
    expect(result.gluteus_maximus).toBe(3);
    expect(result.gluteus_medius).toBe(4);
  });
});

describe("checkProgressiveOverload", () => {
  test("all sets at top → ready", () => {
    const result = checkProgressiveOverload({
      training_log: [
        {
          exercise: "Hip Thrust",
          sets: [
            { weight_kg: 40, reps: 15 },
            { weight_kg: 40, reps: 15 },
            { weight_kg: 40, reps: 15 },
          ],
          rep_range_top: 15,
        },
      ],
    });
    expect(result[0].ready_to_increase).toBe(true);
    expect(result[0].reason).toContain("ready to increase weight");
  });

  test("mixed reps → not ready", () => {
    const result = checkProgressiveOverload({
      training_log: [
        {
          exercise: "Goblet Squat",
          sets: [
            { weight_kg: 12, reps: 12 },
            { weight_kg: 12, reps: 10 },
            { weight_kg: 12, reps: 9 },
          ],
          rep_range_top: 12,
        },
      ],
    });
    expect(result[0].ready_to_increase).toBe(false);
    expect(result[0].reason).toContain("Not all sets");
  });
});

describe("scheduleDeload", () => {
  test("7 weeks → needed", () => {
    const result = scheduleDeload({
      weeks_since_last_deload: 7,
      consecutive_stall_sessions: 0,
      sleep_hours_avg: 8,
    });
    expect(result.deload_needed).toBe(true);
    expect(result.reason).toContain("7 weeks since last deload");
    expect(result.deload_protocol).toEqual({
      volume_reduction: "50%",
      duration_weeks: 1,
      intensity: "same as current working weights",
    });
  });

  test("3 weeks, no stall, good sleep → not needed", () => {
    const result = scheduleDeload({
      weeks_since_last_deload: 3,
      consecutive_stall_sessions: 0,
      sleep_hours_avg: 8,
    });
    expect(result.deload_needed).toBe(false);
    expect(result.deload_protocol).toBeNull();
  });
});
