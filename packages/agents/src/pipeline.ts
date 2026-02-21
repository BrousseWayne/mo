import Anthropic from "@anthropic-ai/sdk";
import type { IntakeData, AgentEnvelope } from "@mo/shared";
import type { Database } from "@mo/database";
import type { AgentContext, PipelineResult } from "./types.js";
import { createUsdaFdcClient } from "./clients/usda-fdc.js";
import { createNutritionCache, type NutritionCache } from "./clients/nutrition-cache.js";
import { runScientist } from "./agents/scientist.js";
import { runNutritionist } from "./agents/nutritionist.js";
import { runDietitian } from "./agents/dietitian.js";
import { runChef } from "./agents/chef.js";
import { runCoach } from "./agents/coach.js";
import { runPhysician } from "./agents/physician.js";

type AgentRunner = (
  client: Anthropic,
  context: AgentContext
) => Promise<AgentEnvelope>;

const agentRegistry: Record<string, AgentRunner> = {
  SCIENTIST: runScientist,
  NUTRITIONIST: runNutritionist,
  DIETITIAN: runDietitian,
  CHEF: runChef,
  COACH: runCoach,
};

const PIPELINE_ORDER = [
  "SCIENTIST",
  "NUTRITIONIST",
  "DIETITIAN",
  "CHEF",
  "COACH",
];

const NUTRITION_TOOL_AGENTS = new Set(["DIETITIAN", "CHEF"]);

function createNutritionCacheIfAvailable(db: Database): NutritionCache | undefined {
  if (!process.env.USDA_FDC_API_KEY) return undefined;
  const usdaClient = createUsdaFdcClient();
  return createNutritionCache(db, usdaClient);
}

export async function runPipeline(params: {
  client: Anthropic;
  runId: string;
  intake: IntakeData;
  agents: string[];
  db?: Database;
  onAgentStart?: (agent: string) => void;
  onAgentComplete?: (agent: string, output: AgentEnvelope) => void;
  onAgentError?: (agent: string, error: Error) => void;
}): Promise<PipelineResult> {
  const {
    client,
    runId,
    intake,
    agents,
    db,
    onAgentStart,
    onAgentComplete,
    onAgentError,
  } = params;
  const outputs: AgentEnvelope[] = [];

  const nutritionCache = db ? createNutritionCacheIfAvailable(db) : undefined;

  const orderedAgents = PIPELINE_ORDER.filter((a) => agents.includes(a));

  for (const agentName of orderedAgents) {
    const runner = agentRegistry[agentName];
    if (!runner) {
      return {
        runId,
        outputs,
        status: "failed",
        error: `Agent ${agentName} not implemented`,
      };
    }

    onAgentStart?.(agentName);

    try {
      const callPhysician = async (query: {
        query_type: string;
        query: string;
        requesting_agent: string;
      }) => {
        return runPhysician(client, { intake, previousOutputs: outputs, runId }, query.query);
      };
      const context: AgentContext = {
        intake,
        previousOutputs: outputs,
        runId,
        callPhysician,
        nutritionCache: NUTRITION_TOOL_AGENTS.has(agentName) ? nutritionCache : undefined,
      };
      const output = await runner(client, context);
      outputs.push(output);
      onAgentComplete?.(agentName, output);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onAgentError?.(agentName, error);
      return {
        runId,
        outputs,
        status: "failed",
        error: `${agentName}: ${error.message}`,
      };
    }
  }

  return { runId, outputs, status: "completed" };
}
