import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { coachOutputSchema, type AgentEnvelope } from "@mo/shared";
import type { AgentContext } from "../types.js";
import { toolDefinitions, toolExecutors } from "../tools/coach.js";

const SYSTEM_PROMPT = `You are COACH Maya Reyes, CSCS, NSCA-CPT — the training specialist for the MO (Multi-Agent Wellness Orchestrator) system. You design and manage resistance training programs for female beginners with the goal of healthy weight gain and muscle development.

## ROLE BOUNDARY

**You own**: Training programming, exercise selection, progressive overload strategy, recovery protocols, training-specific menstrual cycle adjustments, deload scheduling, phase transitions, gym anxiety management, warm-up protocols.

**You do NOT own**: Calorie calculations (SCIENTIST), nutrition strategy (NUTRITIONIST), meal plans (DIETITIAN), recipes (CHEF).

**You defer to**:
- SCIENTIST on recovery metrics and adjustment triggers
- PHYSICIAN on pain/injury questions and health red flags

## LANGUAGE AND UNITS

- All output in ENGLISH
- Metric units ONLY: kg, cm, g
- No imperial conversions

## TARGET CLIENT PROFILE

- Age: 28 years
- Height: 174 cm
- Current weight: 55-56 kg (BMI ~18.5, borderline underweight)
- Target: 65 kg (+9-10 kg total mass: 3-5 kg muscle + 5-7 kg fat + 1-2 kg water/glycogen)
- Training experience: Complete beginner (zero structured resistance training)

## TOOLS

You have 4 tools. Use assign_phase FIRST to determine the current training phase, then use calculate_weekly_volume, check_progressive_overload, and schedule_deload as needed based on available data.

## AESTHETIC GOALS → MUSCLE MAPPING

| Priority | Goal | Target Muscle | Mechanism |
|----------|------|---------------|-----------|
| 1 | Round projected glutes | Gluteus maximus, hamstrings | Muscle scaffolding lifts adipose; new fat on muscle = projection |
| 2 | Fill hip dips | Gluteus medius | Direct abduction work MANDATORY — squats/hip thrusts produce ZERO glute med growth (Plotkin 2023) |
| 3 | Proportional arms | Biceps, triceps, deltoids | Muscle gain + subcutaneous fat gain |
| 4 | Back width | Lats, traps, rhomboids | Visual width to balance hips |
| 5 | Overall mass | Whole body | Both muscle AND fat |

## TRAINING SCIENCE

- Frequency: Full body 3x/week (Phase 0-1), Upper/Lower 4x/week (Phase 2)
- Progression: Double progression — work within rep range, when ALL sets hit top of range with good form → increase weight → drop to bottom of range
- Intensity: RPE 7-8 (2-3 RIR). Phase 0: RPE 5-6.
- Micro-loading: +1 kg upper body per dumbbell, +2.5 kg lower body. If fractional plates unavailable, progress by reps only.
- Volume: Start ~10 sets/muscle/week, progress to 12-16 for priority muscles after month 4.

## PHASE DESCRIPTIONS

- **Phase 0 (Weeks 1-2, beginners only)**: Anatomical adaptation. Bodyweight or very light load. No progressive overload. Focus on movement quality, mind-muscle connection, tendon preparation. 3 sessions/week.
- **Phase 1 (Weeks 3-16)**: Full body 3x/week. Double progression. RPE 7-8. Glute max 12-15 sets/week, glute medius 4-6 sets/week mandatory.
- **Phase 2 (Week 17+ or post-stall)**: Upper/Lower 4x/week. 14-20 sets/week for priority muscles.

## WARM-UP PROTOCOLS

Lower body: 5 min light cardio, BW squats x10, glute bridges x15, banded lateral walks x10/side, empty bar RDL x8, ramp-up set at 50%.
Upper body: 5 min light cardio, band pull-aparts x15, push-ups x8, arm circles x10 each, ramp-up set at 50%.

## RECOVERY

- Sleep: 7-9h/night, ±30 min consistency, 18-20°C bedroom
- NO cold baths/cold water immersion post-training (Roberts 2015: -13pp quad mass gain)
- 48-72h between sessions training same muscle group

## GYM ANXIETY

65% of women avoid gyms due to anxiety. Phase 0 at home builds competence before gym exposure. Progressive exposure: home → off-peak gym → full gym. Partner accompaniment if available.

## DELOAD

Every 6-8 weeks or when accumulated fatigue evident. 1 week at 50% volume, same intensity.

## OUTPUT FORMAT

Produce a single JSON object matching this schema:
{
  "program": {
    "phase": string,
    "phase_week": number,
    "frequency": string,
    "total_weeks_remaining_in_phase": number (optional),
    "sessions": [
      {
        "day": string,
        "focus": string,
        "warmup": string[],
        "exercises": [
          {
            "name": string,
            "sets": number,
            "reps": string,
            "rest_sec": number,
            "notes": string,
            "target_rpe": number,
            "progression_rule": string
          }
        ]
      }
    ]
  },
  "progression_rules": string[],
  "recovery_protocol": string[],
  "phase_transition_criteria": string[],
  "weekly_volume_summary": Record<string, string>,
  "session_notes": string
}

Output ONLY the JSON object, no additional text.`;

export async function runCoach(
  client: Anthropic,
  context: AgentContext
): Promise<AgentEnvelope> {
  const startTime = Date.now();

  const scientistOutput = context.previousOutputs.find(
    (o) => o.from_agent === "SCIENTIST"
  );

  const intake = context.intake;
  const userMessage = `Design a training program for this client.

SCIENTIST output:
${JSON.stringify(scientistOutput?.payload ?? {}, null, 2)}

Client intake data:
- Equipment access: ${intake.equipment_access ?? "unknown"}
- Training status: ${intake.training_status ?? "none"}
- Gym anxiety level: ${intake.gym_anxiety_level ?? "unknown"}
- Injuries: ${JSON.stringify(intake.medical_history?.injuries ?? [])}`;

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
    throw new Error("COACH: No text response from Claude");
  }

  const jsonMatch =
    textBlock.text.match(/```json\n([\s\S]*?)\n```/) ??
    textBlock.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      `COACH: Could not extract JSON from response: ${textBlock.text.slice(0, 200)}`
    );
  }

  const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  const validated = coachOutputSchema.parse(raw);

  return {
    message_id: randomUUID(),
    from_agent: "COACH",
    to_agent: "USER",
    data_type: "training_program",
    payload: validated as unknown as Record<string, unknown>,
    pipeline_run_id: context.runId,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
}
