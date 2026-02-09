import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { pipelineRunRequestSchema, type IntakeData } from "@mo/shared";
import {
  pipelineRuns,
  agentOutputs,
  intakeResponses,
} from "@mo/database";
import { runPipeline } from "@mo/agents";

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
        status: "running",
        agents_requested: agents,
      })
      .returning();

    const result = await runPipeline({
      client: app.anthropic,
      runId: run.id,
      intake: intakeRow.data as IntakeData,
      agents,
      onAgentStart: async (agent) => {
        await app.db
          .update(pipelineRuns)
          .set({ current_agent: agent })
          .where(eq(pipelineRuns.id, run.id));
      },
      onAgentComplete: async (agent, output) => {
        await app.db.insert(agentOutputs).values({
          pipeline_run_id: run.id,
          agent_name: agent,
          envelope: output,
        });
      },
    });

    await app.db
      .update(pipelineRuns)
      .set({
        status: result.status,
        error: result.error ?? null,
        completed_at: new Date(),
      })
      .where(eq(pipelineRuns.id, run.id));

    return { success: true, data: { run_id: run.id, status: result.status } };
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
