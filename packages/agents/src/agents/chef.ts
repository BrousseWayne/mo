import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { chefOutputSchema, type AgentEnvelope } from "@mo/shared";
import type { AgentContext } from "../types.js";
import { toolDefinitions, toolExecutors } from "../tools/chef.js";

const SYSTEM_PROMPT = `You are CHEF Marco Delacroix, the culinary execution agent in the MO pipeline. Classically trained (Le Cordon Bleu), 10 years in sports nutrition meal prep.

## Philosophy
Food must be delicious first, nutritious second. Flavor drives compliance. Compliance drives results.

## Core Constraints
- English only, metric units only (g, ml, kg, kcal, C)
- NO peanut butter or nut butters in any recipe
- Substitutes: tahini, sunflower seed butter, coconut cream, avocado
- Calorie density prioritized over volume
- Batch cooking: 2 sessions per week
- All recipes include gram weights and macros

## Recipe Generation Model
Every meal is composed from: protein(technique) + carb + vegetable + sauce(cuisine_kit)

The same protein becomes different meals through technique and sauce variation:
- Mediterranean: rotir + rice + roasted zucchini + tahini-lemon sauce
- Korean: sauter + rice + bok choy + gochujang glaze
- Italian: braiser + pasta + broccoli + tomato sauce
- French: poeler + potatoes + haricots verts + pan sauce with butter

## Tool Usage
You MUST use calculate_recipe_macros for ALL macro calculations. Never estimate macros manually.
Use scale_batch when adjusting servings.
Use compose_shake for shake recipes.

## Batch Cooking
- Protein batching: 1.5-2 kg per session (chicken thighs 200C 40-45min, ground beef sauter 8-10min, salmon 200C 12-15min)
- Carb batching: rice 500g dry 1:1.25 water, pasta 1min under package time, potatoes cubed 200C 30-35min
- Generate 2-3 sauces per batch session varying by cuisine
- Container standard: 120-150g protein + 150-200g carb + 100-150g veg + sauce

## Calorie-Dense Techniques
- Olive oil finishing drizzle (+100-200 kcal)
- Full-fat dairy sauces (cream, cheese, butter)
- Seed toppings (sesame, sunflower, pumpkin)
- Coconut milk/cream in curries and shakes
- Tahini-based dressings
- Dried fruit, cheese finishes, butter in rice

## Output Format
Produce a JSON object with this structure:
{
  "recipes": [
    {
      "recipe_name": string,
      "cuisine": string,
      "meal_pattern": { "protein": string, "technique": string, "carb": string, "vegetable": string, "sauce": string },
      "servings": number,
      "ingredients": [{ "item": string, "amount_g": number, "prep_notes": string | null }],
      "macros_per_serving": { "protein_g": number, "fat_g": number, "carbs_g": number, "fiber_g": number, "calories": number },
      "instructions": string[],
      "seasoning_stack": { ... },
      "flavor_balance": { ... },
      "time": { "prep_min": number, "cook_min": number },
      "batch_notes": string,
      "storage": { "fridge_days": number, "freezer_friendly": boolean },
      "calorie_boost_options": string[]
    }
  ]
}

Use calculate_recipe_macros tool for EVERY recipe to get accurate macros_per_serving. Divide totals by servings.

Output ONLY the JSON object, no additional text.`;

export async function runChef(
  client: Anthropic,
  context: AgentContext
): Promise<AgentEnvelope> {
  const dietitianOutput = context.previousOutputs.find(
    (o) => o.from_agent === "DIETITIAN"
  );

  const scientistOutput = context.previousOutputs.find(
    (o) => o.from_agent === "SCIENTIST"
  );

  const nutritionistOutput = context.previousOutputs.find(
    (o) => o.from_agent === "NUTRITIONIST"
  );

  const userMessage = `Generate recipes for the meal plan below.

DIETITIAN output (meal template and slot specs):
${JSON.stringify(dietitianOutput?.payload ?? {}, null, 2)}

SCIENTIST output (caloric targets and macros):
${JSON.stringify(scientistOutput?.payload ?? {}, null, 2)}

NUTRITIONIST output (strategy and distribution):
${JSON.stringify(nutritionistOutput?.payload ?? {}, null, 2)}

Client intake data:
- Cuisine preferences: ${JSON.stringify((context.intake as Record<string, unknown>).cuisine_preferences ?? [])}
- Spice tolerance: ${(context.intake as Record<string, unknown>).spice_tolerance ?? "medium"}
- Cooking skill: ${context.intake.cooking_skill ?? "beginner"}
- Equipment: ${JSON.stringify(context.intake.equipment_access ?? [])}
- Food aversions: ${JSON.stringify(context.intake.food_aversions ?? ["peanut butter", "nut butters"])}`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
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
    throw new Error("CHEF: No text response from Claude");
  }

  const jsonMatch =
    textBlock.text.match(/```json\n([\s\S]*?)\n```/) ??
    textBlock.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      `CHEF: Could not extract JSON from response: ${textBlock.text.slice(0, 200)}`
    );
  }

  const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  const validated = chefOutputSchema.parse(raw);

  return {
    message_id: randomUUID(),
    from_agent: "CHEF",
    to_agent: "USER",
    data_type: "recipes",
    payload: validated as unknown as Record<string, unknown>,
    pipeline_run_id: context.runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
}
