import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { agentOutputs } from "@mo/database";

export async function agentsRoutes(app: FastifyInstance) {
  app.get<{ Params: { name: string; runId: string } }>(
    "/agents/:name/output/:runId",
    async (request, reply) => {
      const { name, runId } = request.params;

      const [output] = await app.db
        .select()
        .from(agentOutputs)
        .where(
          and(
            eq(agentOutputs.pipeline_run_id, runId),
            eq(agentOutputs.agent_name, name)
          )
        )
        .limit(1);

      if (!output) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Agent output not found" },
        });
      }

      return { success: true, data: output };
    }
  );
}
