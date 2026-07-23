import type { CoachOutput } from "@mo/shared";

type TemplateSession = CoachOutput["program"]["sessions"][number];
type TemplateExercise = TemplateSession["exercises"][number];

export interface LoggedExercise {
  name: string;
  target_weight_kg?: number;
  actual?: { weight_kg: number; reps: number }[];
}

export interface LoggedSession {
  day_of_week: string;
  status: string;
  exercises: LoggedExercise[];
}

const DOUBLE_PROGRESSION_RULE = /^double_progression_([\d.]+)kg$/;

function parseRepRange(reps: string): { min: number; max: number } | null {
  const match = reps.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  return { min, max };
}

function findLoggedExercise(
  previousSessions: LoggedSession[],
  day: string,
  name: string
): LoggedExercise | undefined {
  const sameDay = previousSessions.find((s) => s.day_of_week === day.toLowerCase());
  const fromDay = sameDay?.exercises.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (fromDay) return fromDay;
  for (const session of previousSessions) {
    const found = session.exercises.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

function progressExercise(
  exercise: TemplateExercise,
  previous: LoggedExercise | undefined
): TemplateExercise {
  const rule = exercise.progression_rule.match(DOUBLE_PROGRESSION_RULE);
  if (!rule) return { ...exercise };

  const increment = Number(rule[1]);
  const range = parseRepRange(exercise.reps);

  if (!previous) return { ...exercise };

  if (!previous.actual?.length) {
    return previous.target_weight_kg !== undefined
      ? { ...exercise, target_weight_kg: previous.target_weight_kg }
      : { ...exercise };
  }

  const workingWeight = Math.max(...previous.actual.map((s) => s.weight_kg));
  const topReached =
    range !== null &&
    previous.actual.length >= exercise.sets &&
    previous.actual.every((s) => s.reps >= range.max);

  return {
    ...exercise,
    target_weight_kg: topReached ? workingWeight + increment : workingWeight,
  };
}

export function generateWeekSessions(
  coach: CoachOutput,
  previousSessions: LoggedSession[]
): TemplateSession[] {
  return coach.program.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) =>
      progressExercise(exercise, findLoggedExercise(previousSessions, session.day, exercise.name))
    ),
  }));
}
