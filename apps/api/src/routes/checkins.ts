import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { weeklyCheckinSchema } from "@mo/shared";
import type { AgentEnvelope } from "@mo/shared";
import {
  getProgramById,
  updateProgramTargets,
  createProgressEntry,
  getProgressHistory,
  getRecentWeights,
  computeWeekNumber,
  agentOutputs,
  pipelineRuns,
  adjustments,
  getSessionsForWeek,
  getUnresolvedUrgentFlags,
} from "@mo/database";
import { evaluateAllTriggers, getAgentsToRerun, detectNewMilestones } from "@mo/agents";
import { getMilestones, createMilestone } from "@mo/database";

export async function checkinRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    "/programs/:id/checkins",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      if (program.status !== "active") {
        return reply.status(400).send({
          success: false,
          error: { code: "PROGRAM_NOT_ACTIVE", message: `Program is ${program.status}` },
        });
      }

      const urgentFlags = await getUnresolvedUrgentFlags(app.db, program.id);
      if (urgentFlags.length > 0) {
        return reply.status(409).send({
          success: false,
          error: {
            code: "UNRESOLVED_RED_FLAGS",
            message: `${urgentFlags.length} unresolved urgent red flag(s) must be acknowledged or resolved before check-in`,
            details: urgentFlags.map((f) => ({ id: f.id, type: f.flag_type })),
          },
        });
      }

      const parsed = weeklyCheckinSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid check-in data", details: parsed.error.flatten() },
        });
      }

      const weekNumber = computeWeekNumber(program);
      const data = parsed.data;

      const entry = await createProgressEntry(app.db, {
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

      await updateProgramTargets(app.db, program.id, {
        current_weight_kg: data.weight_kg,
        current_week: weekNumber,
      });

      const existingMilestones = await getMilestones(app.db, program.id);
      const allProgress = await getProgressHistory(app.db, program.id, { limit: 52 });
      const allSessions: { week_number: number; status: string; exercises: unknown }[] = [];
      for (let w = 1; w <= weekNumber; w++) {
        const ws = await getSessionsForWeek(app.db, program.id, w);
        for (const s of ws) allSessions.push({ week_number: s.week_number, status: s.status, exercises: s.exercises });
      }
      const newMilestones = detectNewMilestones(
        { current_weight_kg: data.weight_kg, target_weight_kg: program.target_weight_kg },
        allProgress.map((p) => ({ week_number: p.week_number, weight_kg: p.weight_kg, minimum_viable_days_count: p.minimum_viable_days_count, created_at: p.created_at })),
        allSessions,
        existingMilestones.map((m) => ({ type: m.type, value: m.value }))
      );
      for (const ms of newMilestones) {
        await createMilestone(app.db, { program_id: program.id, type: ms.type, value: ms.value, achieved_at: new Date(ms.achieved_at) });
      }

      const recentProgress = await getProgressHistory(app.db, program.id, { limit: 10 });
      const sessions = await getSessionsForWeek(app.db, program.id, weekNumber);
      const trainingSessions = sessions.map((s) => ({
        exercises: (s.exercises as { name: string; actual?: { weight_kg: number; reps: number }[] }[]),
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
        },
        recentProgress.map((p) => ({
          weight_kg: p.weight_kg,
          week_number: p.week_number,
          waist_cm: p.waist_cm,
          hip_cm: p.hip_cm,
          minimum_viable_days_count: p.minimum_viable_days_count,
        })),
        trainingSessions
      );

      let pipelineRunId: string | null = null;

      if (triggers.length > 0) {
        const { rerun, skip } = getAgentsToRerun(triggers);

        const latestRun = await app.db
          .select()
          .from(pipelineRuns)
          .where(eq(pipelineRuns.program_id, program.id))
          .orderBy(desc(pipelineRuns.created_at))
          .limit(1);

        const cachedOutputs: AgentEnvelope[] = [];
        if (latestRun[0]) {
          const outputs = await app.db
            .select()
            .from(agentOutputs)
            .where(eq(agentOutputs.pipeline_run_id, latestRun[0].id));

          for (const agentName of skip) {
            const cached = outputs.find((o) => o.agent_name === agentName);
            if (cached) cachedOutputs.push(cached.envelope as AgentEnvelope);
          }
        }

        const [run] = await app.db
          .insert(pipelineRuns)
          .values({
            user_id: program.user_id,
            intake_response_id: program.intake_response_id,
            program_id: program.id,
            status: "pending",
            agents_requested: rerun,
            trigger: "weekly_checkin",
          })
          .returning();

        pipelineRunId = run.id;

        for (const trigger of triggers) {
          await app.db.insert(adjustments).values({
            program_id: program.id,
            pipeline_run_id: run.id,
            trigger_type: trigger.trigger_type,
            old_values: trigger.old_values,
            new_values: trigger.new_values,
            affected_agents: trigger.affected_agents,
            reason: trigger.reason,
          });
        }

        await app.queue.add("pipeline.checkin", {
          type: "pipeline.checkin" as const,
          runId: run.id,
          userId: program.user_id,
          intakeResponseId: program.intake_response_id,
          programId: program.id,
          agents: rerun,
          cachedOutputs,
        });
      }

      return {
        success: true,
        data: {
          checkin_id: entry.id,
          week_number: weekNumber,
          triggers_fired: triggers.map((t) => t.trigger_type),
          pipeline_run_id: pipelineRunId,
        },
      };
    }
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>(
    "/programs/:id/checkins",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const limit = request.query.limit ? Number(request.query.limit) : 20;
      const offset = request.query.offset ? Number(request.query.offset) : 0;
      const entries = await getProgressHistory(app.db, program.id, { limit, offset });

      return { success: true, data: entries };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/programs/:id/checkins/summary",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const weights = await getRecentWeights(app.db, program.id, 100);
      const weeksOnProgram = computeWeekNumber(program);
      const startWeight = program.current_weight_kg;
      const latestWeight = weights[0]?.weight_kg ?? startWeight;
      const totalGained = latestWeight - (weights[weights.length - 1]?.weight_kg ?? startWeight);

      const weeklyRates = weights.slice(0, -1).map((w, i) => w.weight_kg - weights[i + 1].weight_kg);
      const avgWeeklyRate = weeklyRates.length > 0
        ? weeklyRates.reduce((a, b) => a + b, 0) / weeklyRates.length
        : 0;

      return {
        success: true,
        data: {
          total_gained_kg: Math.round(totalGained * 100) / 100,
          avg_weekly_rate_kg: Math.round(avgWeeklyRate * 100) / 100,
          weeks_on_program: weeksOnProgram,
          total_checkins: weights.length,
          latest_weight_kg: latestWeight,
        },
      };
    }
  );
}
