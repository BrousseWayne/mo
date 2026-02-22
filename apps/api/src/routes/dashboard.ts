import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import {
  getProgramById,
  getProgressHistory,
  getRecentWeights,
  computeWeekNumber,
  adjustments,
} from "@mo/database";
import { computeCompliance } from "@mo/agents";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/programs/:id/dashboard",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const entries = await getProgressHistory(app.db, program.id, { limit: 52 });
      const weights = await getRecentWeights(app.db, program.id, 100);
      const weeksOnProgram = computeWeekNumber(program);

      const pctToGoal = program.target_weight_kg > 0
        ? Math.round(((program.current_weight_kg - (program.target_weight_kg - (program.target_weight_kg - program.current_weight_kg))) / (program.target_weight_kg - program.current_weight_kg)) * 100)
        : 0;

      const weeklyRates = weights.slice(0, -1).map((w, i) => w.weight_kg - weights[i + 1].weight_kg);
      const weeklyRateAvg = weeklyRates.length > 0
        ? weeklyRates.reduce((a, b) => a + b, 0) / weeklyRates.length
        : 0;

      const compliance = computeCompliance(
        entries.map((e) => ({ minimum_viable_days_count: e.minimum_viable_days_count, week_number: e.week_number })),
        []
      );

      const recentAdj = await app.db
        .select()
        .from(adjustments)
        .where(eq(adjustments.program_id, program.id))
        .orderBy(desc(adjustments.created_at))
        .limit(3);

      return {
        success: true,
        data: {
          current_weight_kg: program.current_weight_kg,
          target_weight_kg: program.target_weight_kg,
          weekly_rate_avg: Math.round(weeklyRateAvg * 100) / 100,
          compliance_pct: compliance.meal_adherence_pct,
          days_on_program: weeksOnProgram * 7,
          current_phase: program.current_phase,
          current_tier: program.current_tier,
          recent_adjustments: recentAdj,
        },
      };
    }
  );
}
