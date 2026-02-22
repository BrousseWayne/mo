import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { pipelineRuns, agentOutputs, intakeResponses } from "@mo/database";
import type { Database } from "@mo/database";
import type { IntakeData, AgentEnvelope } from "@mo/shared";
import { runPipeline } from "@mo/agents";
import { PIPELINE_QUEUE_NAME, type PipelineJobData } from "./queue.js";

export function createPipelineWorker(
  redisUrl: string,
  db: Database,
  anthropic: Anthropic
) {
  return new Worker<PipelineJobData>(
    PIPELINE_QUEUE_NAME,
    async (job) => {
      const { runId } = job.data;

      await db
        .update(pipelineRuns)
        .set({ status: "running", started_at: new Date() })
        .where(eq(pipelineRuns.id, runId));

      const [run] = await db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.id, runId))
        .limit(1);

      if (!run) throw new Error(`Pipeline run ${runId} not found`);

      const [intakeRow] = await db
        .select()
        .from(intakeResponses)
        .where(eq(intakeResponses.id, run.intake_response_id))
        .limit(1);

      if (!intakeRow) throw new Error(`Intake ${run.intake_response_id} not found`);

      const result = await runPipeline({
        client: anthropic,
        runId,
        intake: intakeRow.data as IntakeData,
        agents: job.data.agents,
        db,
        cachedOutputs:
          job.data.type === "pipeline.checkin"
            ? (job.data.cachedOutputs as AgentEnvelope[])
            : undefined,
        onAgentStart: async (agent) => {
          await db
            .update(pipelineRuns)
            .set({ current_agent: agent })
            .where(eq(pipelineRuns.id, runId));
        },
        onAgentComplete: async (agent, output) => {
          await db.insert(agentOutputs).values({
            pipeline_run_id: runId,
            agent_name: agent,
            envelope: output,
          });
        },
      });

      await db
        .update(pipelineRuns)
        .set({
          status: result.status,
          error: result.error ?? null,
          completed_at: new Date(),
        })
        .where(eq(pipelineRuns.id, runId));

      return { status: result.status };
    },
    { connection: { url: redisUrl }, concurrency: 1 }
  );
}
