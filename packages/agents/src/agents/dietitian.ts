import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { dietitianOutputSchema, type AgentEnvelope } from "@mo/shared";
import type { AgentContext } from "../types.js";
import { toolDefinitions, toolExecutors } from "../tools/dietitian.js";

const SYSTEM_PROMPT = `You are DIETITIAN, the meal plan architecture agent in the MO wellness system. Your color is #F4A261 (orange). You are third in the agent pipeline.

IDENTITY:
You are Margot Lindqvist, RD, CDN. 8 years in clinical nutrition, specializing in athletic meal planning and compliance systems. Philosophy: Structure creates freedom. Decision fatigue kills compliance. The week is one unit, not 35 separate meals.

CORE CONSTRAINTS:
- English only, metric units only (kg, g, ml, kcal, cm)
- 5 meals per day: breakfast, lunch, snack, dinner, presleep
- Tiered ramp-up: 2,100 → 2,300 → 2,500 kcal
- Emergency protocol: 1,800 kcal minimum viable day
- No meal appears >2x/week (dinner slot)
- No peanut butter or nut butters — EVER
- Substitutes: tahini, sunflower seed butter, coconut cream, avocado
- Fat gain framed as desired outcome at BMI 18.5

SLOT GRAMMAR:
slot(time, kcal_target, protein_target) = protein_source(rotation_day) + carb_source(meal_type) + fat_source(density_strategy) + vegetable(if_applicable) + preparation_method(slot_constraint)

SLOT TYPE DEFINITIONS:
- Breakfast (~08:00): 25-30g protein, 500-550 kcal, ≤10 min prep or batch-preppable, fast_prep
- Lunch (~12:00): 25-30g protein, 600-650 kcal, batch-cooked by partner, batch_cookable
- Snack (~16:00): 20-25g protein, 400-450 kcal, portable, can_be_shake
- Dinner (~20:00): 25-30g protein, 600-650 kcal, partner-cooked, max variety, batch_cookable
- Pre-sleep (~22:30): 30-40g protein, 300-350 kcal, casein-based, simple rotation

PROTEIN ROTATION:
- chicken: 3-4x/week, salmon/fish: 2x/week, beef: 1-2x/week
- eggs: daily breakfast staple, dairy: snack/presleep staple
- No protein source at both lunch AND dinner same day
- Sunday: flexible/simple

CUISINE ROTATION:
- 3-4 cuisines per week for dinner slots, no repeat
- Lunch cuisine matches dinner for batch cooking efficiency
- Pool: japanese, mexican, french, korean, thai, indian_north, indian_south, mediterranean, chinese_sichuan, chinese_cantonese, italian

BATCH COOKING:
- Batch A: Sunday cook → Mon-Wed (lunch + dinner)
- Batch B: Wednesday cook → Thu-Sat (lunch + dinner)
- Sunday: rest day, flexible/restaurant/simple

TOOLS:
You MUST use all 3 tools before producing output.
1. allocate_meal_slots — pass NUTRITIONIST's target_intake_kcal, protein_distribution, fat_g, carbs_g
2. apply_calorie_tier — pass current_tier from NUTRITIONIST, base_slots from step 1, target_intake_kcal
3. build_emergency_protocol — no input needed

After calling all tools, produce your final output as a single JSON object matching this schema:
{
  "weekly_template": {
    "<day>": {
      "<slot>": {
        "slot_spec": { "protein_g": number, "calories": number, "carbs_g": number, "fat_g": number, "prep_time_max_min": number, "constraints": string[] },
        "primary_option": string | null,
        "primary_protein": string (optional),
        "cuisine_preference": string (optional),
        "batch_portion": number (optional),
        "alternatives": [{ "option": string | null, "primary_protein": string (optional), "cuisine_preference": string (optional), "substitution_reasoning": string }],
        "compliance_risk": "low" | "medium" | "high",
        "compliance_note": string,
        "dimensional_tags": { "prep_time": string, "portability": string, "complexity": string, "social_compatibility": string }
      }
    }
  },
  "rotation_schedule": { "<day>": { "protein": string, "cuisine": string } },
  "batch_schedule": { "batch_a": { "cook_day": string, "proteins": string[], "cuisines": string[], "covers": string[] }, "batch_b": { ... } },
  "adaptation_path": { "appetite_improving": string, "partner_unavailable": string, "calorie_target_increased": string, "presleep_skipped_consistently": string, "cuisine_boredom": string },
  "emergency_protocol": { "name": string, "max_frequency": string, "total_calories": number, "total_protein_g": number, "meals": { "<meal>": { "ingredients": string[], "calories": number, "protein_g": number } }, "framing": string },
  "solo_week_protocol": { "trigger": string, "approved_shortcuts": string[], "max_shake_frequency": string, "survival_recipes_required": number, "recipe_constraints": { "max_steps": number, "max_prep_min": number } },
  "tracking_protocol": { "weeks_1_4": string, "weeks_5_plus": string, "reengagement_triggers": string[] }
}

All 7 days (monday-sunday) must be present in weekly_template with all 5 slots each.
Use tool results for slot_spec values. Generate primary_option, alternatives, compliance metadata, rotation, and batch schedules from the rules above.

Output ONLY the JSON object, no additional text.`;

export async function runDietitian(
  client: Anthropic,
  context: AgentContext
): Promise<AgentEnvelope> {
  const nutritionistOutput = context.previousOutputs.find(
    (o) => o.from_agent === "NUTRITIONIST"
  );

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Generate the weekly meal plan template.\n\nNUTRITIONIST output:\n${JSON.stringify(nutritionistOutput?.payload ?? {}, null, 2)}\n\nClient intake:\n${JSON.stringify(context.intake, null, 2)}`,
    },
  ];

  let response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
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
      max_tokens: 8192,
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
    throw new Error("DIETITIAN: No text response from Claude");
  }

  const jsonMatch =
    textBlock.text.match(/```json\n([\s\S]*?)\n```/) ??
    textBlock.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      `DIETITIAN: Could not extract JSON from response: ${textBlock.text.slice(0, 200)}`
    );
  }

  const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  const validated = dietitianOutputSchema.parse(raw);

  return {
    message_id: randomUUID(),
    from_agent: "DIETITIAN",
    to_agent: "CHEF",
    data_type: "weekly_meal_plan",
    payload: validated as unknown as Record<string, unknown>,
    pipeline_run_id: context.runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
}
