# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MO (Multi-Agent Wellness Orchestrator) is a pipeline-based coaching system for female body recomposition. No code implementation exists yet — currently documentation and planning only.

### Target Use Case

28-year-old woman, 55-56kg, 174cm (BMI ~18.5), goal +9-10kg total mass (3-5kg muscle + 5-7kg fat + 1-2kg water/glycogen) to reach 65kg. Key constraint: peanut butter aversion.

## Architecture

### Agent Pipeline (Sequential)

```
QUESTIONNAIRE → SCIENTIST → NUTRITIONIST → DIETITIAN → CHEF → COACH → OUTPUT
```

Cross-cutting health guardrails (not a dedicated agent) pause pipeline on red flags.

### 5 Agents

| Agent        | Color   | Owns                                                    |
|--------------|---------|--------------------------------------------------------|
| SCIENTIST    | #457B9D | Calculations: BMR, TDEE, macros, metrics, timelines    |
| NUTRITIONIST | #2A9D8F | Strategy: MPS optimization, protein distribution, cycle adjustments |
| DIETITIAN    | #F4A261 | Architecture: weekly meal templates, substitutions, slot specs |
| CHEF         | #E9C46A | Execution: recipes, batch cooking, culinary techniques |
| COACH        | #9B5DE5 | Programming: training, progression, recovery protocols |

### Agent Boundaries

- SCIENTIST produces numbers → NUTRITIONIST consumes and strategizes
- NUTRITIONIST produces strategy → DIETITIAN creates template → CHEF executes recipes
- SCIENTIST triggers adjustments based on metrics → relevant agents execute changes

### Conflict Resolution Hierarchy

1. Health guardrails override all
2. SCIENTIST overrides on numeric matters
3. NUTRITIONIST overrides DIETITIAN/CHEF on nutrition strategy
4. DIETITIAN overrides CHEF on macro compliance
5. COACH autonomous on training, defers to SCIENTIST on recovery metrics

## Canonical Rules

**See [RULES.md](./RULES.md)** for the complete, authoritative reference on:
- Banned terminology (somatotypes, "fast metabolism", "toning", etc.)
- Correct alternatives and evidence-based framing
- Food constraints (no peanut butter, no nut butters)
- Key scientific references
- Red flags triggering referral
- Agent-specific constraints

All project documents must comply with RULES.md. When conflicts exist, RULES.md takes precedence.

## Data Exchange Format

Agents communicate via structured JSON:

```json
{
  "from_agent": "SCIENTIST",
  "to_agent": "NUTRITIONIST",
  "data_type": "macro_targets",
  "payload": { ... },
  "timestamp": "ISO8601",
  "version": "1.0"
}
```

## Planned Tech Stack

- Backend: FastAPI + PostgreSQL + Redis
- Frontend: Next.js or SvelteKit
- Mobile: React Native or Flutter
- Agent Orchestration: LangGraph or CrewAI
- Notifications: Firebase Cloud Messaging

## File Structure

```
RULES.md                # CANONICAL — All terminology, constraints, scientific standards
CLAUDE.md               # Project guidance for Claude Code

plans/                  # Authoritative planning documents
  MO_Agent_Development_Plan.md    # Master specification document

agents/                 # Agent-specific protocols and deliverables
  CHEF_batch_cooking.md           # Batch cooking protocols, sauce recipes
  CHEF_shake_recipes.md           # Calorie-dense shake formulations
  DIETITIAN_meal_template.md      # 7-day meal template with alternatives

knowledge/              # Research papers, methodologies, knowledge bases
  KNOWLEDGE_BASE_training_agent.md
  Protocol_Biohacking_55kg_65kg.md
  conversation_brief_female_mass_gain.md
  references.md

audits/                 # Expert reviews and compliance checks
  EXPERT_AUDIT_25_flags.md

archive/                # Historical/deprecated documents (non-authoritative)
  old_plans/            # Previous plan versions
  compass_artifacts/    # Original compass exports
  futur_stack_FR.md     # French architecture doc (archived)

initial.md              # Client intake protocol
intake-questionnaire.md # Client assessment form (69 questions, agent-mapped)
```

## Cross-Cutting Constraints

- All output in English, metric units only (kg, cm, g, ml, kcal)
- Peanut butter and nut butters excluded from all recommendations (substitutes: tahini, sunflower seed butter, coconut cream, avocado)
- Fat gain framed as desired outcome at BMI 18.5, not negative side effect
- Health guardrails trigger medical referral on: amenorrhea >3mo, eating disorder history, persistent training pain >1wk, thyroid dysfunction signs, RED-S indicators

## Development Status

### Completed
- **CHEF**: Batch cooking protocols, sauce rotation system, shake recipes (see agents/)
- **DIETITIAN**: 7-day meal template with alternatives, slot specs (see agents/)

### Pending
- **Feedback loop**: Weekly monitoring cycle not implemented
- **SCIENTIST**: Calculation engine not documented
- **COACH**: Training protocols referenced but not fully specified
