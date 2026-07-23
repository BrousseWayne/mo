import { eq } from "drizzle-orm";
import { coachOutputSchema, intakeSchema, type TriggerResult, type WeeklyCheckin } from "@mo/shared";
import {
  adjustments,
  intakeResponses,
  programs,
  createProgressEntry,
  updateProgramTargets,
  getProgressHistory,
  getSessionsForWeek,
  getMilestones,
  createMilestone,
  computeWeekNumber,
  getLatestAgentEnvelope,
  createSessionsFromCoachOutput,
  type Database,
} from "@mo/database";
import { evaluateAllTriggers } from "../triggers/engine.js";
import { executeAdjustments, type ProgramAdjustmentUpdates, type ClientProfile } from "../triggers/executor.js";
import { detectNewMilestones } from "../tools/milestones.js";
import { generateWeekSessions, type LoggedExercise } from "../training/generate-week.js";

type ProgramRow = typeof programs.$inferSelect;

export interface CheckinResult {
  checkin_id: string;
  week_number: number;
  triggers: TriggerResult[];
  applied_updates: ProgramAdjustmentUpdates;
  sessions_created: number;
}

async function loadClientProfile(
  db: Database,
  intakeResponseId: string
): Promise<ClientProfile | undefined> {
  const [row] = await db
    .select()
    .from(intakeResponses)
    .where(eq(intakeResponses.id, intakeResponseId))
    .limit(1);
  if (!row) return undefined;
  const parsed = intakeSchema.safeParse(row.data);
  if (!parsed.success) return undefined;
  return { height_cm: parsed.data.height_cm, age: parsed.data.age };
}

export async function processCheckin(
  db: Database,
  program: ProgramRow,
  data: WeeklyCheckin,
  opts: { now?: Date } = {}
): Promise<CheckinResult> {
  const now = opts.now ?? new Date();
  const weekNumber = computeWeekNumber(program, now);

  const entry = await createProgressEntry(db, {
    program_id: program.id,
    week_number: weekNumber,
    weight_kg: data.weight_kg,
    waist_cm: data.waist_cm ?? null,
    hip_cm: data.hip_cm ?? null,
    cycle_phase: data.cycle_phase ?? null,
    cycle_day: data.cycle_day ?? null,
    training_log: data.training_log ?? null,
    subjective_markers: data.subjective_markers ?? null,
    minimum_viable_days_count: data.minimum_viable_days_count ?? null,
    notes: data.notes ?? null,
  });

  await updateProgramTargets(db, program.id, {
    current_weight_kg: data.weight_kg,
    current_week: weekNumber,
  });

  const existingMilestones = await getMilestones(db, program.id);
  const allProgress = await getProgressHistory(db, program.id, { limit: 52 });
  const allSessions: Awaited<ReturnType<typeof getSessionsForWeek>> = [];
  for (let w = 1; w <= weekNumber; w++) {
    const ws = await getSessionsForWeek(db, program.id, w);
    allSessions.push(...ws);
  }

  const newMilestones = detectNewMilestones(
    { current_weight_kg: data.weight_kg, target_weight_kg: program.target_weight_kg },
    allProgress.map((p) => ({
      week_number: p.week_number,
      weight_kg: p.weight_kg,
      minimum_viable_days_count: p.minimum_viable_days_count,
      created_at: p.created_at,
    })),
    allSessions.map((s) => ({ week_number: s.week_number, status: s.status, exercises: s.exercises })),
    existingMilestones.map((m) => ({ type: m.type, value: m.value }))
  );
  for (const ms of newMilestones) {
    await createMilestone(db, {
      program_id: program.id,
      type: ms.type,
      value: ms.value,
      achieved_at: new Date(ms.achieved_at),
    });
  }

  const recentProgress = allProgress.slice(0, 10);
  const triggerSessions = allSessions.map((s) => ({
    exercises: s.exercises as { name: string; actual?: { weight_kg: number; reps: number }[] }[],
    status: s.status,
    week_number: s.week_number,
  }));

  const triggers = evaluateAllTriggers(
    {
      current_week: weekNumber,
      current_weight_kg: data.weight_kg,
      target_weight_kg: program.target_weight_kg,
      last_recalc_weight_kg: program.last_recalc_weight_kg,
      last_protein_recalc_at: program.last_protein_recalc_at,
      started_at: program.started_at,
      current_tier: program.current_tier,
      current_phase: program.current_phase,
    },
    recentProgress.map((p) => ({
      weight_kg: p.weight_kg,
      week_number: p.week_number,
      waist_cm: p.waist_cm,
      hip_cm: p.hip_cm,
      minimum_viable_days_count: p.minimum_viable_days_count,
    })),
    triggerSessions,
    now
  );

  let applied: ProgramAdjustmentUpdates = {};

  if (triggers.length > 0) {
    const profile = await loadClientProfile(db, program.intake_response_id);
    applied = executeAdjustments(
      {
        current_weight_kg: data.weight_kg,
        target_intake_kcal: program.target_intake_kcal,
        surplus_kcal: program.surplus_kcal,
        current_phase: program.current_phase,
      },
      triggers,
      profile,
      now
    );

    for (const trigger of triggers) {
      const isCalorieTrigger =
        trigger.trigger_type === "insufficient_gain" || trigger.trigger_type === "excessive_gain";
      const enrich = isCalorieTrigger && applied.target_intake_kcal !== undefined;
      await db.insert(adjustments).values({
        program_id: program.id,
        pipeline_run_id: null,
        trigger_type: trigger.trigger_type,
        old_values: enrich
          ? { ...trigger.old_values, target_intake_kcal: program.target_intake_kcal }
          : trigger.old_values,
        new_values: enrich
          ? { ...trigger.new_values, target_intake_kcal: applied.target_intake_kcal }
          : trigger.new_values,
        affected_agents: trigger.affected_agents,
        reason: trigger.reason,
      });
    }

    if (Object.keys(applied).length > 0) {
      await updateProgramTargets(db, program.id, applied);
    }
  }

  let sessionsCreated = 0;
  if (!allSessions.some((s) => s.week_number === weekNumber)) {
    const envelope = await getLatestAgentEnvelope(db, program.id, "COACH");
    const payload =
      envelope && typeof envelope === "object" && "payload" in envelope
        ? (envelope as { payload: unknown }).payload
        : undefined;
    const coach = coachOutputSchema.safeParse(payload);
    if (coach.success) {
      const previousWeek = Math.max(0, ...allSessions.map((s) => s.week_number));
      const previousSessions = allSessions
        .filter((s) => s.week_number === previousWeek)
        .map((s) => ({
          day_of_week: s.day_of_week,
          status: s.status,
          exercises: s.exercises as LoggedExercise[],
        }));
      const created = await createSessionsFromCoachOutput(db, program.id, weekNumber, {
        ...coach.data,
        program: {
          ...coach.data.program,
          sessions: generateWeekSessions(coach.data, previousSessions),
        },
      });
      sessionsCreated = created.length;
    }
  }

  return {
    checkin_id: entry.id,
    week_number: weekNumber,
    triggers,
    applied_updates: applied,
    sessions_created: sessionsCreated,
  };
}
