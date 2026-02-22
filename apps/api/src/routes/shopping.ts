import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { getProgramById, agentOutputs, pipelineRuns } from "@mo/database";
import { generateShoppingList } from "@mo/agents";

export async function shoppingRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { week?: string } }>(
    "/programs/:id/shopping-list",
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
        return { success: true, data: [] };
      }

      const outputs = await app.db
        .select()
        .from(agentOutputs)
        .where(eq(agentOutputs.pipeline_run_id, latestRun[0].id));

      const chefOutput = outputs.find((o) => o.agent_name === "CHEF");
      if (!chefOutput?.envelope) {
        return { success: true, data: [] };
      }

      const payload = (chefOutput.envelope as any).payload;
      const recipes = payload?.recipes ?? payload?.weekly_recipes ?? [];
      const shoppingList = generateShoppingList(recipes);

      return { success: true, data: shoppingList };
    }
  );

  app.get<{ Params: { id: string }; Querystring: { week?: string } }>(
    "/programs/:id/batch-cooking-plan",
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

      const chefOutput = outputs.find((o) => o.agent_name === "CHEF");
      const payload = chefOutput?.envelope ? (chefOutput.envelope as any).payload : null;

      return {
        success: true,
        data: payload?.batch_cooking_plan ?? payload?.batch_cooking ?? null,
      };
    }
  );
}
