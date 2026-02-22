import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import {
  pipelineRuns,
  agentOutputs,
  intakeResponses,
  updateProgramTargets,
} from "@mo/database";
import type { Database } from "@mo/database";
import type { IntakeData, AgentEnvelope, ScientistOutput } from "@mo/shared";
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
        onAgentComplete: async (agent, output, trace) => {
          await db.insert(agentOutputs).values({
            pipeline_run_id: runId,
            agent_name: agent,
            envelope: output,
            llm_trace: trace ?? null,
            duration_ms: trace?.duration_ms,
          });

          if (agent === "SCIENTIST" && run.program_id) {
            const payload = (output as AgentEnvelope).payload as unknown as ScientistOutput;
            await updateProgramTargets(db, run.program_id, {
              target_intake_kcal: payload.target_intake_kcal,
              protein_g: payload.macros.protein_g,
              fat_g: payload.macros.fat_g,
              carbs_g: payload.macros.carbs_g,
              surplus_kcal: payload.surplus_kcal,
            });
          }
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
