import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { pipelineRunRequestSchema } from "@mo/shared";
import {
  pipelineRuns,
  agentOutputs,
  intakeResponses,
} from "@mo/database";

export async function pipelineRoutes(app: FastifyInstance) {
  app.post("/pipeline/run", async (request, reply) => {
    const parsed = pipelineRunRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid pipeline request",
          details: parsed.error.flatten(),
        },
      });
    }

    const { user_id, intake_response_id, agents } = parsed.data;

    const [intakeRow] = await app.db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.id, intake_response_id))
      .limit(1);

    if (!intakeRow) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Intake response not found" },
      });
    }

    const [run] = await app.db
      .insert(pipelineRuns)
      .values({
        user_id,
        intake_response_id,
        status: "pending",
        agents_requested: agents,
        trigger: "initial",
      })
      .returning();

    await app.queue.add("pipeline.initial", {
      type: "pipeline.initial" as const,
      runId: run.id,
      userId: user_id,
      intakeResponseId: intake_response_id,
      agents,
    });

    return { success: true, data: { run_id: run.id, status: "pending" } };
  });

  app.get<{ Params: { id: string } }>(
    "/pipeline/:id",
    async (request, reply) => {
      const { id } = request.params;

      const [run] = await app.db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.id, id))
        .limit(1);

      if (!run) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Pipeline run not found" },
        });
      }

      const outputs = await app.db
        .select()
        .from(agentOutputs)
        .where(eq(agentOutputs.pipeline_run_id, id));

      return { success: true, data: { ...run, outputs } };
    }
  );
}
