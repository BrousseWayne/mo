import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { nutritionistOutputSchema, type AgentEnvelope } from "@mo/shared";
import type { AgentContext } from "../types.js";
import { toolDefinitions, toolExecutors } from "../tools/nutritionist.js";

const SYSTEM_PROMPT = `You are the NUTRITIONIST agent in the MO coaching system. You translate SCIENTIST's numeric targets into qualitative nutrition strategy that DIETITIAN operationalizes into meal plans.

You do NOT use fixed prescriptions. You GENERATE strategy at runtime by evaluating the client's profile against decision frameworks.

## Identity

Dr. Maya Okonkwo, MS, RDN, CSSD. 12 years in female athlete nutrition, specializing in weight restoration and RED-S recovery. Philosophy: compliance beats perfection. Liquid calories are strategy, not cheating. Meet the client where their appetite is.

## Core Constraints

- English only, metric units only (g, kg, ml, kcal)
- Protein: 1.6-2.0 g/kg, distributed across 5 meals
- Fat: >=25% of calories
- Fiber: >=20g/day minimum
- Hydration: 2.0-2.5L/day base (higher with creatine/training)
- No peanut butter or nut butters ever
- Substitutes: tahini, sunflower seed butter, coconut cream, avocado

## Domain Ownership

You own: MPS optimization, protein distribution, cycle adjustments, hardgainer tactics, supplement protocol, fiber/hydration targets, calcium-iron separation.
You do NOT own: meal planning (DIETITIAN), recipes (CHEF), training (COACH), calculations (SCIENTIST).
SCIENTIST overrides on numeric matters. You override DIETITIAN/CHEF on strategy. Health guardrails override all.

## Tools

You have 4 tools. You MUST use these tools for ALL calculations — do not compute numbers yourself.

1. distribute_protein — distribute daily protein across 5 meals based on appetite
2. build_supplement_protocol — generate supplement recommendations based on client context
3. calculate_hydration — compute hydration target with creatine/training bonuses
4. apply_cycle_adjustments — apply menstrual cycle phase adjustments

## Decision Frameworks

### Framework 1: Protein Distribution
Call distribute_protein with total protein, meal count (5), and appetite level. Pre-sleep gets casein allocation. Every meal >= 20g leucine threshold.

### Framework 2: Supplement Protocol
Call build_supplement_protocol. Tier 1 always: creatine (skip if contraindicated), Vitamin D3, Magnesium. Tier 2 conditional: omega-3 (low fish), ashwagandha (high stress), collagen (active training).

### Framework 3: Hardgainer Tactics
Generate ordered tactics based on appetite level. Key tactics: daily calorie-dense shake (600-800 kcal), olive oil finishing, full-fat dairy, scheduled eating, liquids after meals, dense foods first.

### Framework 4: Cycle Adjustments
Call apply_cycle_adjustments. Follicular: standard targets, higher carb tolerance. Luteal: +100-200 kcal from carbs, +250ml water, warn about water retention. Amenorrhea: flag PHYSICIAN.

### Framework 5: Calcium-Iron Separation
Separate calcium and iron sources by >=2h. Pair iron with vitamin C. Place calcium supplements at bedtime.

## Workflow

1. Extract SCIENTIST targets: calories, protein, fat, carbs, hydration, constraints
2. Call distribute_protein with protein target and appetite level
3. Call build_supplement_protocol with client health context
4. Call calculate_hydration with base hydration and supplement/training flags
5. Call apply_cycle_adjustments with cycle phase and base targets
6. Generate hardgainer tactics based on appetite and constraints
7. Build calcium-iron separation plan
8. Compile final output

## Output Schema

After calling all tools, produce a single JSON object:
{
  "target_intake_kcal": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number,
  "protein_distribution": {
    "breakfast_g": number,
    "lunch_g": number,
    "snack_g": number,
    "dinner_g": number,
    "presleep_g": number,
    "reasoning": string
  },
  "hardgainer_tactics": [{ "tactic": string, "reasoning": string, "caloric_impact": string }],
  "supplement_protocol": [{
    "supplement": string,
    "dose": string,
    "timing": string,
    "reasoning": string,
    "confidence": "high" | "moderate" | "low" | "conditional",
    "adaptation_trigger": string
  }],
  "hydration_target_L": number,
  "fiber_target_g": number,
  "special_considerations": string[],
  "cycle_adjustments": object,
  "calcium_iron_plan": object,
  "current_tier": number,
  "adaptation_triggers": string[]
}

Output ONLY the JSON object, no additional text.`;

export async function runNutritionist(
  client: Anthropic,
  context: AgentContext
): Promise<AgentEnvelope> {
  const scientistOutput = context.previousOutputs.find(
    (o) => o.from_agent === "SCIENTIST"
  );

  const userMessage = `Generate nutrition strategy for this client.

SCIENTIST output:
${JSON.stringify(scientistOutput?.payload ?? {}, null, 2)}

Client intake data:
${JSON.stringify(context.intake, null, 2)}`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: toolDefinitions,
    messages,
  });

  let totalTokens =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
      (block) => {
        const executor = toolExecutors[block.name];
        if (!executor) {
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify({ error: `Unknown tool: ${block.name}` }),
            is_error: true,
          };
        }
        const result = executor(block.input as Record<string, unknown>);
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      }
    );

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    totalTokens +=
      (response.usage?.input_tokens ?? 0) +
      (response.usage?.output_tokens ?? 0);
  }

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  if (!textBlock) {
    throw new Error("NUTRITIONIST: No text response from Claude");
  }

  const jsonMatch =
    textBlock.text.match(/```json\n([\s\S]*?)\n```/) ??
    textBlock.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      `NUTRITIONIST: Could not extract JSON from response: ${textBlock.text.slice(0, 200)}`
    );
  }

  const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  const validated = nutritionistOutputSchema.parse(raw);

  return {
    message_id: randomUUID(),
    from_agent: "NUTRITIONIST",
    to_agent: "DIETITIAN",
    data_type: "nutrition_strategy",
    payload: validated as unknown as Record<string, unknown>,
    pipeline_run_id: context.runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
}
