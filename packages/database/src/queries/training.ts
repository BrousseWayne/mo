import { eq, and } from "drizzle-orm";
import type { Database } from "../client.js";
import { trainingSessions } from "../schema.js";
import type { CoachOutput } from "@mo/shared";

type SessionSelect = typeof trainingSessions.$inferSelect;

const DAY_MAP: Record<string, "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
  sunday: "sunday",
};

export async function createSessionsFromCoachOutput(
  db: Database,
  programId: string,
  weekNumber: number,
  coachOutput: CoachOutput
): Promise<SessionSelect[]> {
  const sessions = coachOutput.program.sessions.map((s) => ({
    program_id: programId,
    week_number: weekNumber,
    day_of_week: DAY_MAP[s.day.toLowerCase()] ?? ("monday" as const),
    focus: s.focus,
    warmup: s.warmup,
    exercises: s.exercises,
  }));

  if (sessions.length === 0) return [];

  return db
    .insert(trainingSessions)
    .values(sessions)
    .returning();
}

export async function getSessionsForWeek(
  db: Database,
  programId: string,
  weekNumber: number
): Promise<SessionSelect[]> {
  return db
    .select()
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.program_id, programId),
        eq(trainingSessions.week_number, weekNumber)
      )
    );
}

export async function logSessionActuals(
  db: Database,
  sessionId: string,
  actuals: { exerciseName: string; sets: { weight_kg: number; reps: number; rpe?: number }[] }[]
): Promise<SessionSelect> {
  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, sessionId))
    .limit(1);

  if (!session) throw new Error(`Training session ${sessionId} not found`);

  const exercises = session.exercises as {
    name: string;
    sets: number;
    reps: string;
    rest_sec: number;
    notes: string;
    target_rpe: number;
    progression_rule: string;
    actual?: unknown[];
  }[];

  for (const actual of actuals) {
    const exercise = exercises.find(
      (e) => e.name.toLowerCase() === actual.exerciseName.toLowerCase()
    );
    if (exercise) {
      exercise.actual = actual.sets;
    }
  }

  const [updated] = await db
    .update(trainingSessions)
    .set({ exercises })
    .where(eq(trainingSessions.id, sessionId))
    .returning();

  return updated;
}

export async function markSessionComplete(
  db: Database,
  sessionId: string
): Promise<SessionSelect> {
  const [updated] = await db
    .update(trainingSessions)
    .set({ status: "completed", completed_at: new Date() })
    .where(eq(trainingSessions.id, sessionId))
    .returning();
  if (!updated) throw new Error(`Training session ${sessionId} not found`);
  return updated;
}

export async function markSessionSkipped(
  db: Database,
  sessionId: string,
  reason?: string
): Promise<SessionSelect> {
  const [updated] = await db
    .update(trainingSessions)
    .set({ status: "skipped", notes: reason ?? null })
    .where(eq(trainingSessions.id, sessionId))
    .returning();
  if (!updated) throw new Error(`Training session ${sessionId} not found`);
  return updated;
}
