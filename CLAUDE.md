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

PHYSICIAN is on-demand (any agent can invoke it for health questions or red flags).

### 6 Agents

| Agent        | Color   | Owns                                                    | Position |
|--------------|---------|--------------------------------------------------------|----------|
| SCIENTIST    | #457B9D | Calculations: BMR, TDEE, macros, metrics, timelines    | 1st (sequential) |
| NUTRITIONIST | #2A9D8F | Strategy: MPS optimization, protein distribution, cycle adjustments | 2nd (sequential) |
| DIETITIAN    | #F4A261 | Architecture: weekly meal templates, substitutions, slot specs | 3rd (sequential) |
| CHEF         | #E9C46A | Execution: recipes, batch cooking, culinary techniques | 4th (sequential) |
| COACH        | #9B5DE5 | Programming: training, progression, recovery protocols | 5th (sequential) |
| PHYSICIAN    | #E63946 | Health advisory: red flags, referrals, medical context | On-demand |

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

## Tech Stack (see plans/TECH_STACK_ADR.md)

- Backend: Fastify (TypeScript) + PostgreSQL
- Frontend: Next.js (later, not MVP)
- Mobile: React Native + Expo (later)
- Agent Orchestration: Custom TypeScript pipeline
- LLM: Anthropic Claude (Sonnet 4.5 pipeline, Haiku 4.5 PHYSICIAN)
- Cache: Redis (later, not MVP)
- Notifications: Firebase Cloud Messaging (later)
- Cloud: AWS (ECS Fargate, RDS, ElastiCache) (later)

## File Structure

```
CLAUDE.md                              # Project entry point (Claude Code config)
RULES.md                               # Canonical constraints (absolute authority)
intake-questionnaire.md                # Client intake form (69 questions)

agents/                                # AUTHORITATIVE: system prompts + I/O schemas
  SCIENTIST.md                         # Calculation engine agent
  NUTRITIONIST.md                      # Nutrition strategy agent
  DIETITIAN.md                         # Meal plan architecture agent
  CHEF.md                              # Recipe/culinary execution agent
  COACH.md                             # Training programming agent
  PHYSICIAN.md                         # On-demand health advisory agent
  pipeline.md                          # Pipeline orchestration spec

agents/artifacts/                      # DELIVERABLES: runtime-injected content
  chef-batch-cooking.md                # Batch cooking protocols, sauce recipes
  chef-shake-recipes.md                # Calorie-dense shake formulations
  dietitian-meal-template.md           # 7-day meal template with alternatives

plans/                                 # ARCHITECTURE: decisions & schemas
  CLIENT_PROFILE.md                    # Target client locked parameters
  TECH_STACK_ADR.md                    # Architecture decision record
  DATABASE_SCHEMA.md                   # PostgreSQL schema design
  MVP_IMPLEMENTATION_PLAN.md           # MVP implementation plan

knowledge/                             # REFERENCE: non-authoritative context
  references.md                        # Scientific references
  client-protocol.md                   # Client biohacking protocol
  training-knowledge-base.md           # Training agent knowledge base

audits/                                # TRACKING: temporal, non-authoritative
  FULL_AUDIT_REPORT.md                 # 6-pass audit results
  REMAINING_FIXES.md                   # Outstanding work items

archive/                               # HISTORICAL: non-authoritative
  old_plans/                           # Previous plan versions
  compass_artifacts/                   # Original compass exports
  MO_Agent_Development_Plan.md         # Superseded (extracted to CLIENT_PROFILE.md)
```

## Cross-Cutting Constraints

- All output in English, metric units only (kg, cm, g, ml, kcal)
- Peanut butter and nut butters excluded from all recommendations (substitutes: tahini, sunflower seed butter, coconut cream, avocado)
- Fat gain framed as desired outcome at BMI 18.5, not negative side effect
- Health guardrails trigger medical referral on: amenorrhea >3mo, eating disorder history, persistent training pain >1wk, thyroid dysfunction signs, RED-S indicators

## Compliance Hierarchy

1. **RULES.md** — absolute authority
2. **agents/*.md** — agent system prompts
3. **plans/CLIENT_PROFILE.md** — locked client parameters
4. **agents/pipeline.md** — pipeline orchestration
5. **plans/*.md** — architecture decisions
6. **agents/artifacts/*.md** — deliverable content
7. **knowledge/*.md** — supporting reference

If conflict exists, higher-numbered documents defer to lower-numbered ones.

## Development Status

### Completed
- **SCIENTIST**: Calculation engine with tiered BMR/TDEE/macro system (see agents/SCIENTIST.md)
- **CHEF**: Batch cooking protocols, sauce rotation system, shake recipes (see agents/artifacts/)
- **DIETITIAN**: 7-day meal template with alternatives, slot specs (see agents/artifacts/)
- **Pipeline**: Agent orchestration spec formalized (see agents/pipeline.md)

### Pending
- **Feedback loop**: Weekly monitoring cycle not implemented
- **COACH**: Training protocols referenced but not fully specified
