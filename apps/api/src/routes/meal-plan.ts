import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { getProgramById, agentOutputs, pipelineRuns } from "@mo/database";

export async function mealPlanRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { week?: string } }>(
    "/programs/:id/meal-plan",
    async (request, reply) => {
      const program = await getProgramById(app.db, request.params.id);
      if (!program) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Program not found" },
        });
      }

      const latestRun = await app.db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.program_id, program.id))
        .orderBy(desc(pipelineRuns.created_at))
        .limit(1);

      if (!latestRun[0]) {
        return { success: true, data: null };
      }

      const outputs = await app.db
        .select()
        .from(agentOutputs)
        .where(eq(agentOutputs.pipeline_run_id, latestRun[0].id));

      const dietitianOutput = outputs.find((o) => o.agent_name === "DIETITIAN");
      const chefOutput = outputs.find((o) => o.agent_name === "CHEF");

      return {
        success: true,
        data: {
          template: dietitianOutput?.envelope ? (dietitianOutput.envelope as any).payload : null,
          recipes: chefOutput?.envelope ? (chefOutput.envelope as any).payload : null,
        },
      };
    }
  );
}
