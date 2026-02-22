import type { FastifyInstance } from "fastify";
import { weeklyCheckinSchema } from "@mo/shared";
import {
  getProgramById,
  updateProgramTargets,
  createProgressEntry,
  getProgressHistory,
  getRecentWeights,
  computeWeekNumber,
} from "@mo/database";

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

      return { success: true, data: { checkin_id: entry.id, week_number: weekNumber } };
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
