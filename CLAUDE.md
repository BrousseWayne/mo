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

## Scientific Constraints

### Banned Terminology (Pseudoscience)

Never use: ectomorph, mesomorph, endomorph, somatotype, "fast metabolism", "fixed body type", "anabolic window", "toning", "long lean muscles"

### Correct Alternatives

- "Difficulty gaining weight" → likely lower appetite + higher NEAT
- "Fast metabolism" → "High NEAT (non-exercise activity thermogenesis)"
- "Anabolic window" → "Peri-workout nutrition (beneficial but not critical)"

### Key References

- Morton 2018: Protein breakpoint at 1.62g/kg (49 studies, 1863 participants)
- Schoenfeld 2013: Post-workout timing effects disappear when daily intake controlled
- Roberts 2020: Relative hypertrophy identical men/women (effect 0.07, p=0.31)
- Levine 1999: NEAT varies up to 2000 kcal/day between similar-sized people

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
references.md/          # Research papers, methodologies, knowledge bases
MO_Agent_Development_Plan_v2.md   # Master specification document
futur_stack.md          # Architecture and feature roadmap
initial.md              # Client intake protocol
prompt1.md              # Development plan with corrections
```

## Cross-Cutting Constraints

- All output in English, metric units only (kg, cm, g, ml, kcal)
- Peanut butter excluded from all recommendations (substitutes: almond butter, cashew butter, tahini, sunflower seed butter)
- Fat gain framed as desired outcome at BMI 18.5, not negative side effect
- Health guardrails trigger medical referral on: amenorrhea >3mo, eating disorder history, persistent training pain >1wk, thyroid dysfunction signs, RED-S indicators

## Development Gaps

1. **CHEF**: No recipes or batch cooking protocols documented
2. **DIETITIAN**: No concrete 7-day meal template with alternatives
3. **Feedback loop**: Adjustment triggers defined but weekly monitoring cycle not implemented
