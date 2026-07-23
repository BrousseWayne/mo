import { describe, it, expect } from "vitest";
import { generateWeekSessions, type LoggedSession } from "../generate-week.js";
import type { CoachOutput } from "@mo/shared";

function coachWith(exercises: CoachOutput["program"]["sessions"][number]["exercises"]): CoachOutput {
  return {
    program: {
      phase: "phase_1",
      phase_week: 1,
      frequency: "3x/week full body",
      sessions: [{ day: "monday", focus: "Full body A", warmup: ["5 min cardio"], exercises }],
    },
    progression_rules: [],
    recovery_protocol: [],
    phase_transition_criteria: [],
    weekly_volume_summary: {},
    session_notes: "",
  };
}

const gobletSquat = {
  name: "Goblet Squat",
  sets: 3,
  reps: "8-12",
  rest_sec: 90,
  target_rpe: 7,
  progression_rule: "double_progression_2.5kg",
  notes: "",
};

describe("generateWeekSessions", () => {
  it("copies form_mastery exercises unchanged", () => {
    const coach = coachWith([{ ...gobletSquat, progression_rule: "form_mastery" }]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "monday",
        status: "completed",
        exercises: [{ name: "Goblet Squat", actual: [{ weight_kg: 8, reps: 12 }] }],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBeUndefined();
  });

  it("increases weight when the top of the rep range is reached on all sets", () => {
    const coach = coachWith([gobletSquat]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "monday",
        status: "completed",
        exercises: [
          {
            name: "Goblet Squat",
            actual: [
              { weight_kg: 10, reps: 12 },
              { weight_kg: 10, reps: 12 },
              { weight_kg: 10, reps: 12 },
            ],
          },
        ],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBe(12.5);
  });

  it("keeps the working weight when the range is not completed", () => {
    const coach = coachWith([gobletSquat]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "monday",
        status: "completed",
        exercises: [
          {
            name: "Goblet Squat",
            actual: [
              { weight_kg: 10, reps: 12 },
              { weight_kg: 10, reps: 10 },
              { weight_kg: 10, reps: 9 },
            ],
          },
        ],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBe(10);
  });

  it("keeps the working weight when fewer sets than prescribed were logged", () => {
    const coach = coachWith([gobletSquat]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "monday",
        status: "completed",
        exercises: [
          {
            name: "Goblet Squat",
            actual: [
              { weight_kg: 10, reps: 12 },
              { weight_kg: 10, reps: 12 },
            ],
          },
        ],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBe(10);
  });

  it("carries the previous target forward when the session was not logged", () => {
    const coach = coachWith([gobletSquat]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "monday",
        status: "skipped",
        exercises: [{ name: "Goblet Squat", target_weight_kg: 10 }],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBe(10);
  });

  it("leaves the target unset for a new exercise with no history", () => {
    const coach = coachWith([gobletSquat]);
    const sessions = generateWeekSessions(coach, []);
    expect(sessions[0].exercises[0].target_weight_kg).toBeUndefined();
  });

  it("applies the increment declared in the progression rule", () => {
    const coach = coachWith([
      { ...gobletSquat, name: "Dumbbell Row", progression_rule: "double_progression_1kg", reps: "10", sets: 2 },
    ]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "monday",
        status: "completed",
        exercises: [
          {
            name: "Dumbbell Row",
            actual: [
              { weight_kg: 6, reps: 10 },
              { weight_kg: 6, reps: 10 },
            ],
          },
        ],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBe(7);
  });

  it("finds the previous exercise on another day if the day changed", () => {
    const coach = coachWith([gobletSquat]);
    const previous: LoggedSession[] = [
      {
        day_of_week: "wednesday",
        status: "completed",
        exercises: [
          {
            name: "Goblet Squat",
            actual: [
              { weight_kg: 10, reps: 12 },
              { weight_kg: 10, reps: 12 },
              { weight_kg: 10, reps: 12 },
            ],
          },
        ],
      },
    ];
    const sessions = generateWeekSessions(coach, previous);
    expect(sessions[0].exercises[0].target_weight_kg).toBe(12.5);
  });
});
