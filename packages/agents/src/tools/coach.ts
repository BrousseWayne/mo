import type Anthropic from "@anthropic-ai/sdk";

export interface AssignPhaseInput {
  weeks_on_program: number;
  training_experience: string;
  stall_detected?: boolean;
  consecutive_stall_sessions?: number;
}

export interface AssignPhaseOutput {
  phase: "phase_0" | "phase_1" | "phase_2";
  phase_week: number;
  rationale: string;
}

export function assignPhase(input: AssignPhaseInput): AssignPhaseOutput {
  const stalls = input.consecutive_stall_sessions ?? 0;

  if (input.weeks_on_program <= 2 && input.training_experience === "none") {
    return {
      phase: "phase_0",
      phase_week: input.weeks_on_program,
      rationale:
        "Beginner with no training experience — anatomical adaptation phase for tendon/ligament preparation and movement pattern learning",
    };
  }

  if (input.weeks_on_program >= 17 || stalls >= 3) {
    const phaseStart = 17;
    return {
      phase: "phase_2",
      phase_week: Math.max(input.weeks_on_program - phaseStart, 0),
      rationale:
        stalls >= 3
          ? `${stalls} consecutive stall sessions — transitioning to upper/lower 4x/week`
          : `Week ${input.weeks_on_program} — Phase 1 duration exceeded 16 weeks, transitioning to upper/lower 4x/week`,
    };
  }

  return {
    phase: "phase_1",
    phase_week: input.weeks_on_program - 3,
    rationale: `Week ${input.weeks_on_program} — full body 3x/week hypertrophy phase`,
  };
}

export interface CalculateWeeklyVolumeInput {
  exercises: Array<{ name: string; muscle_groups: string[]; sets: number }>;
}

export function calculateWeeklyVolume(
  input: CalculateWeeklyVolumeInput
): Record<string, number> {
  const volume: Record<string, number> = {};
  for (const exercise of input.exercises) {
    for (const group of exercise.muscle_groups) {
      volume[group] = (volume[group] ?? 0) + exercise.sets;
    }
  }
  return volume;
}

export interface CheckProgressiveOverloadInput {
  training_log: Array<{
    exercise: string;
    sets: Array<{ weight_kg: number; reps: number }>;
    rep_range_top: number;
  }>;
}

export interface OverloadResult {
  exercise: string;
  ready_to_increase: boolean;
  reason: string;
}

export function checkProgressiveOverload(
  input: CheckProgressiveOverloadInput
): OverloadResult[] {
  return input.training_log.map((entry) => {
    const allAtTop = entry.sets.every((s) => s.reps >= entry.rep_range_top);
    return {
      exercise: entry.exercise,
      ready_to_increase: allAtTop,
      reason: allAtTop
        ? `All ${entry.sets.length} sets hit ${entry.rep_range_top} reps — ready to increase weight`
        : `Not all sets at ${entry.rep_range_top} reps — continue at current weight`,
    };
  });
}

export interface ScheduleDeloadInput {
  weeks_since_last_deload: number;
  consecutive_stall_sessions: number;
  sleep_hours_avg: number;
}

export interface ScheduleDeloadOutput {
  deload_needed: boolean;
  reason: string;
  deload_protocol: {
    volume_reduction: string;
    duration_weeks: number;
    intensity: string;
  } | null;
}

export function scheduleDeload(
  input: ScheduleDeloadInput
): ScheduleDeloadOutput {
  const protocol = {
    volume_reduction: "50%",
    duration_weeks: 1,
    intensity: "same as current working weights",
  };

  if (input.weeks_since_last_deload >= 6) {
    return {
      deload_needed: true,
      reason: `${input.weeks_since_last_deload} weeks since last deload — scheduled deload every 6-8 weeks`,
      deload_protocol: protocol,
    };
  }

  if (input.consecutive_stall_sessions >= 3) {
    return {
      deload_needed: true,
      reason: `${input.consecutive_stall_sessions} consecutive stall sessions — accumulated fatigue likely`,
      deload_protocol: protocol,
    };
  }

  if (input.sleep_hours_avg < 6) {
    return {
      deload_needed: true,
      reason: `Average sleep ${input.sleep_hours_avg}h — below 6h threshold, recovery compromised`,
      deload_protocol: protocol,
    };
  }

  return {
    deload_needed: false,
    reason: "No deload triggers met",
    deload_protocol: null,
  };
}

export const toolExecutors: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  assign_phase: (input) => assignPhase(input as unknown as AssignPhaseInput),
  calculate_weekly_volume: (input) =>
    calculateWeeklyVolume(input as unknown as CalculateWeeklyVolumeInput),
  check_progressive_overload: (input) =>
    checkProgressiveOverload(
      input as unknown as CheckProgressiveOverloadInput
    ),
  schedule_deload: (input) =>
    scheduleDeload(input as unknown as ScheduleDeloadInput),
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "assign_phase",
    description:
      "Assign the current training phase based on weeks on program, experience, and stall detection. Phase 0 = form learning (weeks 0-2, beginners with no experience), Phase 1 = full body 3x/week (weeks 3-16), Phase 2 = upper/lower 4x/week (week 17+ or 3+ consecutive stall sessions).",
    input_schema: {
      type: "object" as const,
      properties: {
        weeks_on_program: {
          type: "number",
          description: "Total weeks the client has been on the program",
        },
        training_experience: {
          type: "string",
          description:
            "Training experience level: none, beginner, intermediate",
          enum: ["none", "beginner", "intermediate"],
        },
        stall_detected: {
          type: "boolean",
          description:
            "Whether a training stall has been detected on 2+ compound lifts",
        },
        consecutive_stall_sessions: {
          type: "number",
          description: "Number of consecutive sessions with no progression",
        },
      },
      required: ["weeks_on_program", "training_experience"],
    },
  },
  {
    name: "calculate_weekly_volume",
    description:
      "Calculate total weekly sets per muscle group from a list of exercises. Used to verify volume targets are met (e.g., 12-15 sets/week glute max, 4-6 sets/week glute medius).",
    input_schema: {
      type: "object" as const,
      properties: {
        exercises: {
          type: "array",
          description: "List of exercises with muscle group targeting",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Exercise name" },
              muscle_groups: {
                type: "array",
                items: { type: "string" },
                description:
                  "Muscle groups targeted (e.g., gluteus_maximus, gluteus_medius, hamstrings, back, shoulders, arms, quadriceps)",
              },
              sets: {
                type: "number",
                description: "Number of sets per week for this exercise",
              },
            },
            required: ["name", "muscle_groups", "sets"],
          },
        },
      },
      required: ["exercises"],
    },
  },
  {
    name: "check_progressive_overload",
    description:
      "Check if exercises are ready for weight increase using double progression. If all sets hit the top of the rep range, the exercise is ready to increase weight.",
    input_schema: {
      type: "object" as const,
      properties: {
        training_log: {
          type: "array",
          description: "Recent training log entries",
          items: {
            type: "object",
            properties: {
              exercise: { type: "string", description: "Exercise name" },
              sets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    weight_kg: { type: "number" },
                    reps: { type: "number" },
                  },
                  required: ["weight_kg", "reps"],
                },
              },
              rep_range_top: {
                type: "number",
                description: "Top of the prescribed rep range",
              },
            },
            required: ["exercise", "sets", "rep_range_top"],
          },
        },
      },
      required: ["training_log"],
    },
  },
  {
    name: "schedule_deload",
    description:
      "Determine if a deload week is needed based on time since last deload (>=6 weeks), stall sessions (>=3), or sleep quality (<6h avg). Deload protocol: 50% volume, same intensity, 1 week.",
    input_schema: {
      type: "object" as const,
      properties: {
        weeks_since_last_deload: {
          type: "number",
          description: "Weeks since the last deload week",
        },
        consecutive_stall_sessions: {
          type: "number",
          description: "Number of consecutive sessions with no progression",
        },
        sleep_hours_avg: {
          type: "number",
          description: "Average sleep hours per night over the past week",
        },
      },
      required: [
        "weeks_since_last_deload",
        "consecutive_stall_sessions",
        "sleep_hours_avg",
      ],
    },
  },
];
