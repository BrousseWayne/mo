import type { FastifyInstance } from "fastify";
import { weeklyCheckinSchema } from "@mo/shared";
import {
  getProgramById,
  getProgressHistory,
  getRecentWeights,
  computeWeekNumber,
  getUnresolvedUrgentFlags,
} from "@mo/database";
import { processCheckin } from "@mo/agents";

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

      const result = await processCheckin(app.db, program, parsed.data);

      return {
        success: true,
        data: {
          checkin_id: result.checkin_id,
          week_number: result.week_number,
          triggers_fired: result.triggers.map((t) => t.trigger_type),
          pipeline_run_id: null,
          adjustments_applied: result.applied_updates,
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
