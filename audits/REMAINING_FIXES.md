# MO — Remaining Fixes After P0

**Date**: 2026-02-09
**Context**: P0 items from FULL_AUDIT_REPORT.md are complete. This file lists all remaining work.

---

## P1 — Should Do Before Production

### P1-7: Define API Contract

**Effort**: 2-3 days
**Deliverable**: `plans/API_CONTRACT.md` (OpenAPI spec or equivalent)

Create:
- REST endpoint definitions for all user-facing operations:
  - `POST /intake` — submit questionnaire, trigger initial pipeline
  - `GET /plan/{client_id}` — retrieve current consolidated plan (meals + training)
  - `POST /checkin` — submit weekly check-in, trigger feedback loop
  - `POST /physician/query` — on-demand health question
  - `GET /progress/{client_id}` — progress history and trends
  - `GET /adjustments/{client_id}` — adjustment history
  - `GET /pipeline/{run_id}` — pipeline run status and agent messages
- Authentication/authorization model (JWT or session-based, user roles: client, admin)
- API versioning strategy (URL path: `/v1/`)
- Error response format (standard error envelope with error codes)
- Rate limiting rules
- Pipeline execution model: async with polling (`GET /pipeline/{run_id}/status`) or SSE streaming for real-time progress

**Reference files**:
- `agents/pipeline.md` (pipeline states, message schemas, feedback loop)
- `plans/DATABASE_SCHEMA.md` (entity definitions)
- `plans/TECH_STACK_ADR.md` (Fastify backend confirmed)

---

### P1-8: Resolve DIETITIAN/CHEF External File References in System Prompts

**Effort**: 4-6 hours
**Files to modify**: `agents/DIETITIAN.md`, `agents/CHEF.md`

**Problem**: DIETITIAN system prompt (line 220-226) says `See agents/artifacts/dietitian-meal-template.md`. CHEF system prompt (lines 223-225) says `See agents/artifacts/chef-batch-cooking.md` and `agents/artifacts/chef-shake-recipes.md`. At LLM runtime, these file references will not resolve.

**Fix options** (pick one):
1. **Inline**: Append the referenced content directly into each system prompt. Increases prompt size but eliminates external dependency.
2. **RAG layer**: Keep references but build a retrieval step in the pipeline that injects the referenced content into the prompt context before calling the LLM.
3. **Tool use**: Give agents a `read_reference` tool that fetches the content on demand during execution.

Option 1 is simplest for DIETITIAN (meal template is ~200 lines). CHEF references are larger (batch cooking + shakes), so option 2 or 3 may be better for CHEF.

**Whichever option is chosen**: document the decision in `agents/pipeline.md` under a new "Prompt Assembly" section.

---

### P1-9: Specify Feedback Loop Implementation

**Effort**: 1 day (partially done)
**Status**: `agents/pipeline.md` section 7 covers the weekly check-in schema, processing flow, and output schema. What remains:

- Data collection UI spec: what the weekly check-in form looks like (fields, required vs optional, validation rules)
- Notification trigger: when/how the user is prompted to submit check-in (push notification schedule)
- Partial data handling: what happens if user only submits weight but not measurements
- Multi-trigger priority: if both calorie adjustment and training stall fire in the same week, which executes first
- User-facing adjustment communication: how changes are presented to the user (diff view, explanation, confirmation required?)

**Add this to**: `agents/pipeline.md` section 7 (extend existing spec)

---

## P2 — Important But Non-Blocking

### ~~P2-10: Extract LEXICON.md~~ — SUPERSEDED

Banned terms live in RULES.md, domain terms live in agent .md files. No standalone lexicon needed.

---

### P2-11: Fix RULES.md Violations

**Effort**: 2-3 hours
**Files to modify**: Multiple (search-and-replace)

#### ~~A) "Nut butter" references~~ — DONE

Fixed in `agents/artifacts/dietitian-meal-template.md` (4 refs) and `knowledge/training-knowledge-base.md` (1 ref).

#### ~~B) Imperial unit conversions~~ — DONE

Fixed in `knowledge/training-knowledge-base.md` (removed parenthetical imperial conversions).
Note: `initial.md` and `knowledge/conversation_brief_female_mass_gain.md` archived — no longer active files.

#### C) Negative fat gain framing

Note: `initial.md` archived — no longer an active file.

#### D) Uncited DIETITIAN myth-busting claims

| File | Location | Claim | Fix |
|------|----------|-------|-----|
| `agents/DIETITIAN.md` | Myth-busting section | "Stomach capacity will expand over 2-3 weeks" | Add citation: Geliebter 1988 or similar gastric accommodation study |
| `agents/DIETITIAN.md` | Myth-busting section | "Hunger signals have atrophied" | Add citation: Levitsky 2005 or appetite regulation reference |

---

### P2-12: Fix Shake Recipe Macro Discrepancies

**Effort**: 1-2 hours
**File**: `agents/artifacts/chef-shake-recipes.md`

All 4 shakes have ingredient-level macros that sum to ~166-229 kcal MORE than the stated targets. Root cause: targets were calculated for 1-scoop whey, ingredients were later updated to 1.5 scoops without recalculating.

| Shake | Current Target | Actual (ingredient sum) | Delta |
|-------|---------------|------------------------|-------|
| Chocolate Tahini Power | 720 kcal, 38g P | ~949 kcal, ~56g P | +229 kcal |
| Tropical Coconut Cream | 750 kcal, 35g P | ~946 kcal, ~53g P | +196 kcal |
| Chocolate Sunflower Seed | 680 kcal, 40g P | ~846 kcal, ~58g P | +166 kcal |
| Avocado Date Power | 780 kcal, 36g P | ~970 kcal, ~54g P | +190 kcal |

**Fix**: Recalculate all target values from ingredient-level macros. Update the target lines to match. Also update the "Macro Verification for DIETITIAN" 3/4-portion values (P1-12 from audit).

Also update the shake summary in `agents/CHEF.md` (system prompt lines 159-169) to match corrected targets.

---

### ~~P2-13: Fix Carbohydrate Targets in Protocol and Dev Plan Prose~~ — DONE

Fixed in `knowledge/client-protocol.md` and `knowledge/training-knowledge-base.md`. Dev Plan archived.

---

### P2-14: Create Test Matrix and Golden Dataset

**Effort**: 2-3 days
**Deliverable**: `audits/TEST_MATRIX.md`

Create:
- 3-5 client profiles beyond the target profile (vary age, weight, height, training experience, medical constraints)
- For each profile: expected SCIENTIST output (BMR, TDEE, macros) calculated manually
- Happy path test: full pipeline with target profile, verify each agent's output
- Adjustment trigger tests: simulate 2 weeks of low gain, verify +200 kcal cascade
- Red flag tests: amenorrhea input, verify PHYSICIAN invocation and pipeline pause
- Constraint enforcement: verify no peanut butter in any output
- Edge cases: what if user is already at BMI 25? What if male? What if 45 years old?

---

### P2-15: Multi-Client Generalization Spec

**Effort**: 3-5 days
**Deliverable**: `plans/GENERALIZATION_SPEC.md`

The entire system is documented for a single client profile (28F, 55kg, 174cm). Spec how to parameterize for:
- Different ages (18-65)
- Different starting weights (40-80kg)
- Different heights
- Different goals (mass gain, recomposition, maintenance)
- Male clients (different BMR formula constant, different fat % targets, different muscle gain rates)
- Different medical histories
- Different training experiences (intermediate/advanced)

---

## P3 — Nice to Have

### P3-16: UI Wireframes

**Effort**: 3-5 days
**Deliverable**: `plans/UI_WIREFRAMES.md`

Wireframes or component specs for:
- Intake questionnaire form (69 questions, 8 sections, progressive disclosure)
- Plan output view (meals + training in one view)
- Weekly check-in form
- Progress dashboard (weight chart, measurements, training PRs)
- PHYSICIAN chat interface

---

### P3-17: COACH Prompt Optimization

**Effort**: 4-6 hours
**File**: `agents/COACH.md`

COACH system prompt is ~400 lines / ~12k+ characters. May exceed context limits for some models.

- Measure exact token count with tiktoken or Anthropic's tokenizer
- If >4k tokens: create a chunking strategy (core prompt + phase-specific retrieval)
- Consider extracting Phase 0, Phase 1, Phase 2 programs into separate retrievable documents

---

### P3-18: Food Cost Tiers (Expert Audit Flag 17)

**Effort**: 4-6 hours
**File**: `agents/DIETITIAN.md` or new `knowledge/FOOD_COST_GUIDE.md`

Add budget tiers:
- Budget (~$50-70/week): prioritize eggs, canned fish, bulk rice, frozen veg
- Standard (~$70-100/week): fresh meat, varied produce, Greek yogurt
- Premium (~$100+/week): salmon, organic, specialty items

---

### P3-19: Add Missing Health Guardrails

**Effort**: 2-3 hours
**Files**: `agents/CHEF.md`, `agents/SCIENTIST.md`, `agents/NUTRITIONIST.md`

| Agent | Missing Guardrail | Fix |
|-------|-------------------|-----|
| CHEF | No ED detection (food refusal, purging signs) | Add red flag: "User consistently not finishing meals or reporting food disposal" → escalate to PHYSICIAN |
| SCIENTIST | No RED-S or ED detection | Add red flags: eating disorder indicators, RED-S screening criteria |
| NUTRITIONIST | No amenorrhea or RED-S detection | Add red flags: amenorrhea >3 months, RED-S indicators, thyroid dysfunction signs |

These agents already have red flag tables — add the missing entries to existing tables.
