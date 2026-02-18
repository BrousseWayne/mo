import type { AgentEnvelope, IntakeData } from "@mo/shared";
import type { NutritionCache } from "./clients/nutrition-cache.js";

export interface PhysicianQuery {
  query_type: string;
  query: string;
  requesting_agent: string;
}

export interface AgentContext {
  intake: IntakeData;
  previousOutputs: AgentEnvelope[];
  runId: string;
  callPhysician?: (query: PhysicianQuery) => Promise<AgentEnvelope>;
  nutritionCache?: NutritionCache;
}

export interface PipelineResult {
  runId: string;
  outputs: AgentEnvelope[];
  status: "completed" | "failed" | "paused";
  error?: string;
}
