import Anthropic from "@anthropic-ai/sdk";
import type { IntakeData, AgentEnvelope } from "@mo/shared";
import type { AgentContext, PipelineResult } from "./types.js";
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

export async function runPipeline(params: {
  client: Anthropic;
  runId: string;
  intake: IntakeData;
  agents: string[];
  onAgentStart?: (agent: string) => void;
  onAgentComplete?: (agent: string, output: AgentEnvelope) => void;
  onAgentError?: (agent: string, error: Error) => void;
}): Promise<PipelineResult> {
  const {
    client,
    runId,
    intake,
    agents,
    onAgentStart,
    onAgentComplete,
    onAgentError,
  } = params;
  const outputs: AgentEnvelope[] = [];

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
      const context: AgentContext = { intake, previousOutputs: outputs, runId, callPhysician };
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
