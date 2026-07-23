import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import type { IntakeData, AgentEnvelope } from "@mo/shared";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const agentName = getArg("--agent");
const intakePath = getArg("--intake");

if (!agentName) {
  console.error("Usage: playground --agent SCIENTIST [--intake path/to/intake.json]");
  process.exit(1);
}

const fixturesDir = resolve(import.meta.dirname!, "fixtures");

const intakeFile = intakePath ?? resolve(fixturesDir, "reference-intake.json");
const intake: IntakeData = JSON.parse(readFileSync(intakeFile, "utf-8"));

const previousOutputs: AgentEnvelope[] = [];

const agentOrder = ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"];
const agentIndex = agentOrder.indexOf(agentName.toUpperCase());

if (agentIndex === -1) {
  console.error(`Unknown agent: ${agentName}. Must be one of: ${agentOrder.join(", ")}`);
  process.exit(1);
}

const fixtureMap: Record<string, string> = {
  SCIENTIST: "scientist-output.json",
};

for (let i = 0; i < agentIndex; i++) {
  const prev = agentOrder[i];
  const fixtureName = fixtureMap[prev];
  if (fixtureName) {
    const data = JSON.parse(readFileSync(resolve(fixturesDir, fixtureName), "utf-8"));
    previousOutputs.push(data);
  } else {
    console.warn(`No fixture for ${prev} — skipping. Output may be incomplete.`);
  }
}

const runId = "00000000-0000-0000-0000-000000000000";
const client = new Anthropic();

const runners: Record<string, () => Promise<AgentEnvelope>> = {};

for (const name of agentOrder) {
  runners[name] = async () => {
    const mod = await import(`@mo/agents`);
    const runFn = mod[`run${name.charAt(0) + name.slice(1).toLowerCase()}`];
    if (!runFn) throw new Error(`Runner not found for ${name}`);
    return runFn(client, { intake, previousOutputs, runId });
  };
}

const runner = runners[agentName.toUpperCase()];
if (!runner) {
  console.error(`No runner for ${agentName}`);
  process.exit(1);
}

console.log(`Running ${agentName.toUpperCase()} with intake from ${intakeFile}...`);
console.log(`Previous outputs: ${previousOutputs.length} agent(s)\n`);

const output = await runner();
console.log(JSON.stringify(output, null, 2));
