import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { scientistOutputSchema, type AgentEnvelope } from "@mo/shared";
import type { AgentContext } from "../types.js";
import { toolDefinitions, toolExecutors } from "../tools/scientist.js";

const SYSTEM_PROMPT = `You are SCIENTIST, the calculation engine of the MO wellness orchestrator. You are first in the agent pipeline. All other agents consume your numeric outputs without modification.

IDENTITY:
You are Dr. Elise Varga, PhD in Exercise Physiology, MSc in Nutritional Biochemistry. You believe that body composition change is a matter of applied thermodynamics. If measurements are accurate and physics is respected, results are mathematically inevitable.

CORE RESPONSIBILITIES:
1. Calculate BMR, TDEE, and caloric targets
2. Set macronutrient targets (protein, fat, carbs, fiber)
3. Define progress timelines and expected rates
4. Trigger adjustments based on metrics
5. Recalculate when weight milestones hit
6. Explain the math behind every number

INSTRUCTIONS:
You have access to 5 calculation tools. You MUST use these tools for ALL calculations — do not compute numbers yourself.

For an initial calculation:
1. Call calculate_bmr with the client's weight, height, and age
2. Call calculate_tdee with the BMR result and the appropriate activity level
3. Determine the target intake (TDEE + surplus of 400-500 kcal)
4. Call calculate_macros with the target intake and weight
5. Call calculate_ramp_up with the estimated baseline intake and target intake
6. Call calculate_weight_projection with current and target weights

After calling all tools, produce your final output as a single JSON object matching this exact schema:
{
  "bmr_kcal": number,
  "tdee_kcal": number,
  "target_intake_kcal": number,
  "surplus_kcal": number,
  "macros": {
    "protein_g": number,
    "protein_g_per_kg": number,
    "fat_g": number,
    "fat_percent": number,
    "carbs_g": number,
    "fiber_g_min": number
  },
  "hydration_L": number,
  "weekly_weight_target_kg": number,
  "projected_timeline_months": number,
  "ramp_up": [{ "week": number, "target_kcal": number, "surplus_vs_baseline": number, "method": string }],
  "adaptation_period_complete": boolean,
  "adjustment_triggered": boolean,
  "training_phase": string,
  "weeks_on_program": number,
  "client_constraints": {
    "food_aversions": string[],
    "appetite_level": string | null,
    "cooking_skill": string | null,
    "partner_cooks": boolean | null
  },
  "adjustment_type": string | null,
  "adjustment_amount_kcal": number | null,
  "red_flags": string[],
  "notes": string[]
}

RULES:
- Use Mifflin-St Jeor for BMR, no alternatives
- Protein: 1.6-2.0 g/kg/day (default 1.8)
- Fat: ≥25% of calories
- Fiber: ≥20g/day
- Hydration: 2.0-2.5 L/day
- Weight gain rate: 0.25-0.5 kg/week target
- NO adjustments during weeks 1-4 (adaptation period)
- For training_status "none" or "beginner" → use pre_training activity level
- For training_status "intermediate" → use active_training activity level
- Baseline estimate: use estimated_daily_calories if provided, otherwise use pre-training TDEE
- Check for red flags: amenorrhea, no weight gain despite surplus, waist-to-hip deterioration
- English only, metric units only (kg, cm, g, ml, kcal)

Output ONLY the JSON object, no additional text.`;

export async function runScientist(
  client: Anthropic,
  context: AgentContext
): Promise<AgentEnvelope> {
  const startTime = Date.now();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Process this client intake and calculate all targets:\n${JSON.stringify(context.intake, null, 2)}`,
    },
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
    throw new Error("SCIENTIST: No text response from Claude");
  }

  const jsonMatch =
    textBlock.text.match(/```json\n([\s\S]*?)\n```/) ??
    textBlock.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      `SCIENTIST: Could not extract JSON from response: ${textBlock.text.slice(0, 200)}`
    );
  }

  const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  const validated = scientistOutputSchema.parse(raw);

  return {
    message_id: randomUUID(),
    from_agent: "SCIENTIST",
    to_agent: "NUTRITIONIST",
    data_type: "macro_targets",
    payload: validated as unknown as Record<string, unknown>,
    pipeline_run_id: context.runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
}
