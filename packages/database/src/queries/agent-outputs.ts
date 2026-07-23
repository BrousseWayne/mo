import { eq, and, desc } from "drizzle-orm";
import type { Database } from "../client.js";
import { agentOutputs, pipelineRuns } from "../schema.js";

export async function getLatestAgentEnvelope(
  db: Database,
  programId: string,
  agentName: string
): Promise<unknown | undefined> {
  const [row] = await db
    .select({ envelope: agentOutputs.envelope })
    .from(agentOutputs)
    .innerJoin(pipelineRuns, eq(agentOutputs.pipeline_run_id, pipelineRuns.id))
    .where(
      and(
        eq(pipelineRuns.program_id, programId),
        eq(agentOutputs.agent_name, agentName)
      )
    )
    .orderBy(desc(agentOutputs.created_at))
    .limit(1);
  return row?.envelope;
}
