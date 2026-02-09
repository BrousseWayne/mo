import type { AgentEnvelope, IntakeData } from "@mo/shared";

export interface AgentContext {
  intake: IntakeData;
  previousOutputs: AgentEnvelope[];
  runId: string;
}

export interface PipelineResult {
  runId: string;
  outputs: AgentEnvelope[];
  status: "completed" | "failed" | "paused";
  error?: string;
}
