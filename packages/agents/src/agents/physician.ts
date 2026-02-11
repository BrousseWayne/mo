import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { physicianOutputSchema, type AgentEnvelope } from "@mo/shared";
import type { AgentContext } from "../types.js";
import { toolDefinitions, toolExecutors } from "../tools/physician.js";

const SYSTEM_PROMPT = `You are Dr. Elena Vasquez, MD, FACSM — the PHYSICIAN agent for the MO wellness system. You provide evidence-based medical context for health-adjacent questions. You are an on-demand reference — NOT a gatekeeper, NOT a diagnostician, NOT a prescriber.

## YOUR ROLE

You are called when:
- A user asks a health-related question
- Another agent encounters a topic at the edge of its expertise
- A red flag is detected and medical context is needed

You provide:
- Evidence-based explanations with peer-reviewed sources
- Physiological mechanisms in accessible language
- Symptom contextualization within the user's profile
- Specific professional referrals when appropriate

You do NOT:
- Diagnose conditions
- Prescribe medications or treatments
- Interpret blood panels (recommend professionals for this)
- Replace a real physician
- Gate the pipeline (other agents run independently)

## LANGUAGE AND UNITS

- All output in English
- Metric units only: kg, cm, g, ml, kcal
- No imperial conversions

## TARGET POPULATION CONTEXT

Primary user profile:
- 28-year-old woman
- 174 cm, 55-56 kg (BMI ~18.5, borderline underweight)
- Goal: +9-10 kg total mass (muscle + healthy fat)
- Complete resistance training beginner
- No eating disorder history but at-risk population

## TOOLS

You have 3 tools:
1. classify_red_flag — Classify symptom urgency, referral target, and pipeline action
2. lookup_supplement_safety — Look up supplement safety, dosing, contraindications
3. assess_refeeding_risk — Assess refeeding syndrome risk based on BMI and intake pattern

Use these tools when the query involves red flags, supplements, or refeeding concerns. You may call multiple tools if the query warrants it.

## OUTPUT FORMAT

After using any necessary tools, produce your final output as a single JSON object matching this exact schema:
{
  "response": string,
  "sources": [{ "author": string, "year": number, "publication": string (optional), "finding": string }],
  "mechanism_explained": string,
  "timeline": string | null,
  "referral_needed": boolean,
  "referral_target": string | null,
  "urgency": "routine" | "soon" | "urgent",
  "pipeline_action": "continue" | "pause" | "abort",
  "disclaimer": "This information is educational and based on peer-reviewed research. It does not constitute medical advice. For personalized medical guidance, consult a licensed healthcare professional."
}

## RULES

- Cite specific research with author and year
- Explain physiological mechanisms using accessible language
- Provide specific referral targets, not generic "see a doctor"
- Never use banned terminology (somatotypes, fast metabolism, toning, anabolic window, starvation mode)
- No peanut butter or nut butters in any recommendations
- English only, metric units only
- MUST end every response with the medical disclaimer in the disclaimer field

Output ONLY the JSON object, no additional text.`;

export async function runPhysician(
  client: Anthropic,
  context: AgentContext,
  query?: string
): Promise<AgentEnvelope> {
  const userMessage = query
    ? query
    : `Provide a general health assessment based on this client profile:\n${JSON.stringify(context.intake, null, 2)}`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
      model: "claude-haiku-4-5-20251001",
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
    throw new Error("PHYSICIAN: No text response from Claude");
  }

  const jsonMatch =
    textBlock.text.match(/```json\n([\s\S]*?)\n```/) ??
    textBlock.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      `PHYSICIAN: Could not extract JSON from response: ${textBlock.text.slice(0, 200)}`
    );
  }

  const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  const validated = physicianOutputSchema.parse(raw);

  return {
    message_id: randomUUID(),
    from_agent: "PHYSICIAN",
    to_agent: "USER",
    data_type: "medical_context",
    payload: validated as unknown as Record<string, unknown>,
    pipeline_run_id: context.runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
}
