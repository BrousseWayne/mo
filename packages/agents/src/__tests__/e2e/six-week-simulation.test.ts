import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { eq, inArray } from "drizzle-orm";
import {
  createDb,
  closeDb,
  users,
  intakeResponses,
  programs,
  pipelineRuns,
  agentOutputs,
  adjustments,
  trainingSessions,
  progressEntries,
  milestones,
  getProgramById,
  getSessionsForWeek,
  logSessionActuals,
  markSessionComplete,
  type Database,
} from "@mo/database";
import { intakeSchema, type WeeklyCheckin } from "@mo/shared";
import { createProgramFromArtifacts } from "../../artifacts/create-program.js";
import { processCheckin } from "../../checkin/process-checkin.js";
import { PHASE_TRAINING_ARTIFACTS } from "../../artifacts/phase-artifacts.js";

const ROOT = new URL("../../../../../", import.meta.url);
const D0 = new Date("2026-01-05T08:00:00Z");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function readRootFile(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, ROOT)), "utf-8");
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const match = readRootFile(".env").match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not set and not found in root .env");
  return match[1].trim();
}

function loadTrainingArtifact(phase: string): string | undefined {
  const file = PHASE_TRAINING_ARTIFACTS[phase];
  if (!file) return undefined;
  return readRootFile(`agents/artifacts/${file}`);
}

type Actuals = Parameters<typeof logSessionActuals>[2];

describe("six-week temporal loop simulation", () => {
  let db: Database;
  let userId: string;
  let programId: string;
  let initialKcal: number;
  let initialSurplus: number;

  beforeAll(async () => {
    db = createDb(resolveDatabaseUrl());
    const intake = intakeSchema.parse(JSON.parse(readRootFile("scripts/fixtures/reference-intake.json")));
    const [user] = await db.insert(users).values({}).returning();
    userId = user.id;
    const [intakeRow] = await db
      .insert(intakeResponses)
      .values({ user_id: userId, data: intake })
      .returning();
    const { program } = await createProgramFromArtifacts(db, {
      userId,
      intakeResponseId: intakeRow.id,
      intake,
      mealTemplateMd: readRootFile("agents/artifacts/dietitian-meal-template.md"),
      trainingProgramMd: readRootFile("agents/artifacts/coach-training-program.md"),
    });
    programId = program.id;
    initialKcal = program.target_intake_kcal;
    initialSurplus = program.surplus_kcal;
    await db
      .update(programs)
      .set({ started_at: D0, last_protein_recalc_at: D0 })
      .where(eq(programs.id, programId));
  }, 30000);

  afterAll(async () => {
    if (db && programId) {
      const runs = await db
        .select({ id: pipelineRuns.id })
        .from(pipelineRuns)
        .where(eq(pipelineRuns.program_id, programId));
      const runIds = runs.map((r) => r.id);
      await db.delete(adjustments).where(eq(adjustments.program_id, programId));
      if (runIds.length > 0) {
        await db.delete(agentOutputs).where(inArray(agentOutputs.pipeline_run_id, runIds));
      }
      await db.delete(pipelineRuns).where(eq(pipelineRuns.program_id, programId));
      await db.delete(trainingSessions).where(eq(trainingSessions.program_id, programId));
      await db.delete(progressEntries).where(eq(progressEntries.program_id, programId));
      await db.delete(milestones).where(eq(milestones.program_id, programId));
      await db.delete(programs).where(eq(programs.id, programId));
      await db.delete(intakeResponses).where(eq(intakeResponses.user_id, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    if (db) await closeDb(db);
  }, 30000);

  async function checkin(i: number, data: WeeklyCheckin) {
    const program = await getProgramById(db, programId);
    expect(program).toBeDefined();
    return processCheckin(db, program!, data, {
      now: new Date(D0.getTime() + i * WEEK_MS),
      loadTrainingArtifact,
    });
  }

  async function completeByDay(week: number, day: string, actuals?: Actuals) {
    const sessions = await getSessionsForWeek(db, programId, week);
    const session = sessions.find((s) => s.day_of_week === day);
    expect(session, `week ${week} ${day} session`).toBeDefined();
    if (actuals) await logSessionActuals(db, session!.id, actuals);
    await markSessionComplete(db, session!.id);
  }

  function exerciseInWeek(sessions: { exercises: unknown }[], name: string) {
    const all = sessions.flatMap(
      (s) => s.exercises as { name: string; target_weight_kg?: number }[]
    );
    return all.find((e) => e.name === name);
  }

  it("seeds week 1 from the phase 0 artifact", async () => {
    const program = await getProgramById(db, programId);
    expect(program!.current_phase).toBe("phase_0");
    expect(program!.current_tier).toBe("tier_0");
    expect(program!.last_recalc_weight_kg).toBe(55);
    const week1 = await getSessionsForWeek(db, programId, 1);
    expect(week1).toHaveLength(3);
    expect(exerciseInWeek(week1, "Bodyweight Glute Bridge")).toBeDefined();
  });

  it("check-in 1 records progress and generates week 2 from the phase 0 template", async () => {
    await completeByDay(1, "monday", [
      { exerciseName: "Goblet Squat", sets: [{ weight_kg: 6, reps: 12 }, { weight_kg: 6, reps: 12 }] },
    ]);
    await completeByDay(1, "wednesday");
    await completeByDay(1, "friday");

    const result = await checkin(1, { weight_kg: 55.4, minimum_viable_days_count: 5 });
    expect(result.week_number).toBe(2);
    expect(result.triggers).toHaveLength(0);
    expect(result.sessions_created).toBe(3);

    const week2 = await getSessionsForWeek(db, programId, 2);
    expect(week2).toHaveLength(3);
    const goblet = exerciseInWeek(week2, "Goblet Squat");
    expect(goblet).toBeDefined();
    expect(goblet!.target_weight_kg).toBeUndefined();
  });

  it("check-in 2 fires the phase transition after 6 completed sessions", async () => {
    await completeByDay(2, "monday", [
      { exerciseName: "Goblet Squat", sets: [{ weight_kg: 8, reps: 12 }, { weight_kg: 8, reps: 12 }] },
    ]);
    await completeByDay(2, "wednesday");
    await completeByDay(2, "friday");

    const result = await checkin(2, { weight_kg: 55.8, minimum_viable_days_count: 6 });
    expect(result.week_number).toBe(3);
    expect(result.triggers.map((t) => t.trigger_type)).toContain("phase_transition");

    const program = await getProgramById(db, programId);
    expect(program!.current_phase).toBe("phase_1");

    const week3 = await getSessionsForWeek(db, programId, 3);
    expect(week3).toHaveLength(3);
    expect(exerciseInWeek(week3, "Barbell Hip Thrust")).toBeDefined();
    expect(exerciseInWeek(week3, "Bodyweight Glute Bridge")).toBeUndefined();
  });

  it("check-in 3 fires the tier progression and applies double progression", async () => {
    await completeByDay(3, "monday", [
      {
        exerciseName: "Barbell Hip Thrust",
        sets: [
          { weight_kg: 20, reps: 15 },
          { weight_kg: 20, reps: 15 },
          { weight_kg: 20, reps: 15 },
        ],
      },
    ]);

    const result = await checkin(3, { weight_kg: 56.2, minimum_viable_days_count: 5 });
    expect(result.week_number).toBe(4);
    expect(result.triggers.map((t) => t.trigger_type)).toContain("tier_progression");

    const program = await getProgramById(db, programId);
    expect(program!.current_tier).toBe("tier_1");

    const week4 = await getSessionsForWeek(db, programId, 4);
    expect(exerciseInWeek(week4, "Barbell Hip Thrust")!.target_weight_kg).toBe(22.5);
  });

  it("check-in 4 is a quiet week: targets unchanged, weight repeated after an incomplete range", async () => {
    await completeByDay(4, "monday", [
      {
        exerciseName: "Barbell Hip Thrust",
        sets: [
          { weight_kg: 22.5, reps: 12 },
          { weight_kg: 22.5, reps: 11 },
          { weight_kg: 22.5, reps: 10 },
        ],
      },
    ]);

    const result = await checkin(4, { weight_kg: 56.6, minimum_viable_days_count: 4 });
    expect(result.week_number).toBe(5);
    expect(result.triggers).toHaveLength(0);

    const program = await getProgramById(db, programId);
    expect(program!.target_intake_kcal).toBe(initialKcal);

    const week5 = await getSessionsForWeek(db, programId, 5);
    expect(exerciseInWeek(week5, "Barbell Hip Thrust")!.target_weight_kg).toBe(22.5);
  });

  it("check-in 5 applies the calorie increase and the protein recalc to the program row", async () => {
    await completeByDay(5, "monday", [
      {
        exerciseName: "Barbell Hip Thrust",
        sets: [
          { weight_kg: 22.5, reps: 15 },
          { weight_kg: 22.5, reps: 15 },
          { weight_kg: 22.5, reps: 15 },
        ],
      },
    ]);

    const result = await checkin(5, { weight_kg: 56.65, minimum_viable_days_count: 5 });
    expect(result.week_number).toBe(6);
    const types = result.triggers.map((t) => t.trigger_type);
    expect(types).toContain("insufficient_gain");
    expect(types).toContain("protein_recalc");

    const program = await getProgramById(db, programId);
    expect(program!.target_intake_kcal).toBe(initialKcal + 200);
    expect(program!.surplus_kcal).toBe(initialSurplus + 200);
    expect(program!.protein_g).toBe(102);
    expect(program!.last_protein_recalc_at!.getTime()).toBe(D0.getTime() + 5 * WEEK_MS);

    const rows = await db.select().from(adjustments).where(eq(adjustments.program_id, programId));
    const calorieRow = rows.find((r) => r.trigger_type === "insufficient_gain");
    expect(calorieRow).toBeDefined();
    expect((calorieRow!.new_values as Record<string, unknown>).target_intake_kcal).toBe(initialKcal + 200);

    const week6 = await getSessionsForWeek(db, programId, 6);
    expect(exerciseInWeek(week6, "Barbell Hip Thrust")!.target_weight_kg).toBe(25);
  });

  it("check-in 6 closes the loop with sessions for every week and no pipeline runs enqueued", async () => {
    await completeByDay(6, "monday", [
      {
        exerciseName: "Barbell Hip Thrust",
        sets: [
          { weight_kg: 25, reps: 10 },
          { weight_kg: 25, reps: 10 },
          { weight_kg: 25, reps: 10 },
        ],
      },
    ]);

    const result = await checkin(6, { weight_kg: 57.2, minimum_viable_days_count: 5 });
    expect(result.week_number).toBe(7);
    expect(result.triggers).toHaveLength(0);

    const program = await getProgramById(db, programId);
    expect(program!.current_week).toBe(7);
    expect(program!.current_weight_kg).toBe(57.2);
    expect(program!.current_phase).toBe("phase_1");
    expect(program!.current_tier).toBe("tier_1");
    expect(program!.target_intake_kcal).toBe(initialKcal + 200);

    for (let week = 1; week <= 7; week++) {
      const sessions = await getSessionsForWeek(db, programId, week);
      expect(sessions, `week ${week}`).toHaveLength(3);
    }

    const entries = await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.program_id, programId));
    expect(entries).toHaveLength(6);

    const adjustmentRows = await db
      .select()
      .from(adjustments)
      .where(eq(adjustments.program_id, programId));
    expect(adjustmentRows.map((r) => r.trigger_type).sort()).toEqual([
      "insufficient_gain",
      "phase_transition",
      "protein_recalc",
      "tier_progression",
    ]);
    expect(adjustmentRows.every((r) => r.pipeline_run_id === null)).toBe(true);

    const runs = await db
      .select()
      .from(pipelineRuns)
      .where(eq(pipelineRuns.program_id, programId));
    expect(runs).toHaveLength(2);
    expect(runs.every((r) => r.status === "completed")).toBe(true);
    expect(runs.some((r) => r.trigger === "weekly_checkin")).toBe(false);
    expect(runs.some((r) => r.status === "pending")).toBe(false);
  });
});
