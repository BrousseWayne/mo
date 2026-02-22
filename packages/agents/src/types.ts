import type { AgentEnvelope, IntakeData } from "@mo/shared";
import type { NutritionCache } from "./clients/nutrition-cache.js";
import type { LlmTrace } from "./agents/trace.js";

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
  recentRecipes?: string[];
  ratedRecipes?: { name: string; rating: number }[];
}

export interface PipelineResult {
  runId: string;
  outputs: AgentEnvelope[];
  traces: Record<string, LlmTrace>;
  status: "completed" | "failed" | "paused";
  error?: string;
}
