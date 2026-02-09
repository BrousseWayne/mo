# MO Repository — Full Audit Report

**Date**: 2026-02-09
**Scope**: All .md files in the MO repository (~20+ files, ~4,000+ lines)
**Method**: 6-pass systematic audit with dedicated analysis per pass

---

## Executive Summary

| Severity | Pass 1 | Pass 2 | Pass 3* | Pass 4 | Pass 5** | Pass 6 | Total |
|----------|--------|--------|---------|--------|----------|--------|-------|
| CRITICAL | 7 | 7 | — | 5 | 1 | 3 | 23 |
| MAJOR | 4 | 8 | — | 8 | 2 | 5 | 27 |
| MINOR | 2 | 10 | — | 6 | 4 | 2 | 24 |

\* Pass 3 findings are folded into Pass 4 (schema mismatches) and Pass 2 (consistency issues).
\** Pass 5 counts only NEW findings beyond the 25-flag audit.

**Expert Audit Status**: 21/25 resolved, 2 partially resolved, 2 still open.

**Implementation Verdict**: **NOT READY** — domain knowledge is exceptional; engineering specs are absent. ~5-7 days of P0 work needed before coding can begin.

---

## Pass 1: Numerical Verification

### Root Causes

Two systematic errors account for most findings:

1. **BMR arithmetic error**: 550 + 1087.5 - 140 - 161 was computed as 1,327 instead of 1,336.5. SCIENTIST.md is correct (1,337), but Protocol and Dev Plan propagate 1,327.
2. **Carb macro not recalculated when calorie target changed**: The 220-275g carb range is correct for ~2,100 kcal but was never updated for the 2,500 kcal full protocol target (correct value: ~350-370g).
3. **Shake recipe revision without target update**: All 4 shake ingredient tables contain 1.5 scoops whey, but targets were calculated for 1 scoop.

### Findings

#### P1-01: BMR Miscalculation (CRITICAL)
- **Files**: Protocol_Biohacking_55kg_65kg.md (line 33), MO_Agent_Development_Plan.md (lines 300, 316)
- **Expected**: 1,336.5 kcal (rounded to 1,337)
- **Found**: 1,327 kcal (10 kcal error)
- **Fix**: Change 1,327 → 1,337 in Protocol and Dev Plan

#### P1-02: TDEE Cascading Errors (CRITICAL)
- **Files**: Protocol (line 36), Dev Plan (lines 318-319)
- **Expected**: Pre-training 1,738 kcal; Active-training 2,072 kcal
- **Found**: 1,725 and 2,057 respectively
- **Fix**: Recalculate from corrected BMR

#### P1-03: Ramp-up Surplus Framing Ambiguity (MINOR)
- **Files**: SCIENTIST.md (line 73), Dev Plan (line 329)
- Week 3+ describes "+650-750 vs current / +400-500 vs training TDEE" — conflates behavioral change with thermodynamic surplus
- **Fix**: Label these separately

#### P1-04: Fat Minimum Below 25% Floor (MINOR)
- **Files**: SCIENTIST.md (line 88), Dev Plan (line 345)
- 69g fat × 9 = 621 kcal = 24.84% of 2,500 — technically below the ≥25% constraint
- **Fix**: Round up to 70g

#### P1-05: Carbohydrate Calculation Error (CRITICAL)
- **Files**: SCIENTIST.md (lines 91-92), Dev Plan (line 346), Protocol (line 47)
- At 2,500 kcal with 100g protein + 70g fat: carbs should be ~368g, not ~280g
- The 220-275g range only works for the 2,100 tier
- **Fix**: Provide per-tier carb ranges (Tier 0: ~270g, Tier 1: ~320g, Tier 2: ~368g)

#### P1-06: Protein Range Floor Inconsistent with Slots (MAJOR)
- **Files**: DIETITIAN_meal_template.md (line 13), Dev Plan (line 608)
- Claims 105-155g daily protein, but slot minimums sum to 125g
- **Fix**: Change claimed range to 125-155g, or lower slot minimums

#### P1-07 through P1-10: All 4 Shake Targets Wrong (CRITICAL × 4)
- **File**: CHEF_shake_recipes.md
- Every shake shows ~166-229 kcal more than stated targets
- Protein consistently off by ~18-24g (≈ one scoop whey)

| Shake | Target kcal | Actual kcal | Delta |
|-------|-------------|-------------|-------|
| Chocolate Tahini | 720 | 949 | +229 |
| Tropical Coconut | 750 | 946 | +196 |
| Chocolate Sunflower | 680 | 846 | +166 |
| Avocado Date | 780 | 970 | +190 |

- **Fix**: Decide on 1 or 1.5 scoops, recalculate all targets

#### P1-11: Systematic Shake Error Pattern (CRITICAL)
- All discrepancies suggest targets were calculated for 1-scoop versions, then ingredients updated to 1.5 scoops without recalculating

#### P1-12: Scaled Portions Also Wrong (MAJOR)
- 3/4 portions in "Macro Verification for DIETITIAN" section are derived from wrong targets
- **Fix**: Recalculate from corrected ingredient sums

#### P1-13: Timeline Partially Inconsistent (MAJOR)
- At 0.25-0.5 kg/week: 10kg takes 5-10 months. Claimed 8-14 months.
- 14-month upper bound implies 0.17 kg/week average — below stated floor
- **Fix**: Widen gain rate to 0.17-0.5, narrow timeline to 6-12 months, or note 14-month scenario accounts for interruptions

#### P1-14: JSON Schema Macro Mismatch (MAJOR)
- SCIENTIST.md output JSON: 100g P + 69g F + 280g C = 2,141 kcal, not stated 2,500
- **Fix**: Set carbs_g to 368 in JSON examples

---

## Pass 2: RULES.md Compliance Scan

### Food Constraint Violations

#### P2-03: "nut butters" in KNOWLEDGE_BASE (CRITICAL)
- File: KNOWLEDGE_BASE_training_agent.md line 294
- **Fix**: Replace with "tahini, sunflower seed butter"

#### P2-04 through P2-07: "nut butter" in DIETITIAN_meal_template (CRITICAL × 4)
- Lines 156, 176, 177, 192 — 4 references to banned food
- **Fix**: Replace all with "tahini" or "sunflower seed butter"

### Unit Violations

#### P2-10: Imperial conversions in KNOWLEDGE_BASE (CRITICAL)
- Lines 35-36: "174 cm (5'8.5\")" and "55-56 kg (121-123 lbs)"
- **Fix**: Remove parenthetical imperial conversions

#### P2-11: Imperial conversions in conversation_brief (CRITICAL)
- Lines 13-14, 18: same pattern
- **Fix**: Remove

#### P2-12: Imperial conversion in initial.md (MAJOR)
- Line 38: "2 kg (4.4 lbs)"
- **Fix**: Remove "(4.4 lbs)"

#### P2-13: "cups" in CHEF_batch_cooking (MAJOR)
- Lines 243-244: "1 cup" parsley, "½ cup" cilantro
- **Fix**: Convert to grams (30g, 15g)

### Framing Violations

#### P2-16: Negative fat gain framing (MAJOR)
- initial.md line 76: "Avoid excessive fat gain"
- **Fix**: "Monitor body composition to ensure healthy fat-to-muscle gain ratio"

### Missing Health Guardrails

#### P2-20: CHEF has no health red flags (MAJOR)
- CHEF only monitors culinary compliance, no ED detection
- **Fix**: Add food refusal/purging escalation to PHYSICIAN

#### P2-21: SCIENTIST missing RED-S, ED detection (MAJOR)
- **Fix**: Add eating disorder indicators and RED-S flags

#### P2-22: NUTRITIONIST missing amenorrhea, RED-S (MAJOR)
- **Fix**: Add amenorrhea, RED-S, thyroid signs

### Uncited Claims

#### P2-17: DIETITIAN myth-busting uncited (MAJOR)
- "Stomach capacity will expand over 2-3 weeks" — no citation
- "Hunger signals have atrophied" — no citation
- **Fix**: Add Howarth, Levitsky citations

#### P2-01: Somatotype used prescriptively in archive (CRITICAL — but archived)
- archive/old_plans/prompt-iterations.md line 59
- Low risk (non-authoritative)

---

## Pass 4: Agent Specification Completeness

### Completeness Matrix

| Agent | Prompt | In Schema | Out Schema | Decision | Handoff | Errors | Conflicts | Overall |
|-------|--------|-----------|------------|----------|---------|--------|-----------|---------|
| SCIENTIST | Present | Present | Present | Present | Present | Partial | Present | Strong |
| NUTRITIONIST | Present | Present | Present | Partial | Present | Partial | Present | Strong |
| DIETITIAN | Present | Present | Present | Present | Present | Present | Present | Strongest |
| CHEF | Present | Present | Present | Partial | Present | Partial | Present | Adequate |
| COACH | Present | Present | Present | Present | Present | Present | Present | Strongest |
| PHYSICIAN | Present | Present | Present | Present | Partial | Partial | Partial | Adequate |

### Critical Gaps

#### P4-01: No INTER_AGENTS.md (CRITICAL)
- Pipeline orchestration logic exists only embedded in Dev Plan, not as standalone implementable spec
- **Fix**: Create agents/INTER_AGENTS.md with state machine, JSON schemas, conflict resolution, PHYSICIAN invocation contract

#### P4-04: Feedback Loop Underspecified (CRITICAL)
- Weekly cycle described in 8 lines of pseudocode
- Missing: check-in JSON schema, partial data handling, multi-trigger priority, cascade propagation
- **Fix**: Define weekly_checkin input schema, trigger evaluation logic, cascade rules

#### P4-08: PHYSICIAN Invocation Contract Missing (CRITICAL)
- No programmatic invocation mechanism defined
- Input schema has `from_agent: "PHYSICIAN"` (should be invoking agent)
- No pipeline_action field for pause/resume
- **Fix**: Formalize invocation as synchronous interrupt, add pipeline_action to output

#### P4-10: No Pipeline Orchestration Spec (CRITICAL)
- Missing: orchestrator role, failure handling, validation gates, partial re-execution, latency expectations
- **Fix**: Write orchestration spec covering state management, retries, timeouts

#### P4-14: Weekly Monitoring Data Collection Unspecified (CRITICAL)
- No schema for weekly check-in, no required vs optional fields, no minimum viable data set
- **Fix**: Define weekly_checkin JSON with field annotations

### Major Gaps

#### P4-03: Agent Count Discrepancy (MAJOR)
- CLAUDE.md says 5 agents; Dev Plan says 6; agents/ has 6 files (including PHYSICIAN)
- **Fix**: Update CLAUDE.md to 6 agents, clarify PHYSICIAN as on-demand

#### P4-05: SCIENTIST No Error Handling for Missing Fields (MAJOR)
- Input schema has no required vs optional annotations
- **Fix**: Annotate all fields, specify fallback behavior

#### P4-06: NUTRITIONIST Adjustment Logic Incomplete (MAJOR)
- No validation rules for rejecting SCIENTIST data; no specification for strategy changes during feedback loop

#### P4-07: CHEF Lacks Recipe Selection Logic (MAJOR)
- No decision tree for which recipe fills a slot; no weekly context for variety enforcement

#### P4-11: SCIENTIST → NUTRITIONIST Schema Mismatch (MAJOR)
- `target_intake_kcal` vs `daily_calories`; `client_constraints` not in SCIENTIST output
- **Fix**: Normalize field names or define orchestrator adapter

#### P4-12: NUTRITIONIST → DIETITIAN Schema Mismatch (MAJOR)
- DIETITIAN expects `daily_calories`, `daily_protein_g` that NUTRITIONIST doesn't output

#### P4-13: COACH Pipeline Position Ambiguity (MAJOR)
- COACH receives only from SCIENTIST — could run in parallel with nutrition chain
- **Fix**: Explicitly document parallel vs sequential

#### P4-18: PHYSICIAN No Pause/Resume Mechanism (MAJOR)
- No `pipeline_action` field; no definition of what "pausing" means concretely

---

## Pass 5: Expert Audit Cross-Check

### Resolution Summary

| Status | Count |
|--------|-------|
| Resolved | 21/25 |
| Partially Resolved | 2/25 |
| Still Open | 2/25 |

**Partially Resolved**:
- Flag 8 (peanut butter): Protocol cleaned, but KNOWLEDGE_BASE and DIETITIAN_meal_template still have "nut butter"
- Flag 15 (recipe database): 4 shakes + batch protocols + 6 survival recipes exist; full breakfast/lunch/dinner library still absent

**Still Open**:
- Flag 17 (food cost): No budget tiers or cost guidance anywhere
- Flag 25 (collagen timing): Still says "30-60 min pre-training" — over-specified per audit

### New Issues Found

| ID | Severity | Finding |
|----|----------|---------|
| NEW-1 | CRITICAL | DIETITIAN_meal_template "nut butter" references (lines 176, 177, 192) |
| NEW-2 | MODERATE | KNOWLEDGE_BASE "nut butters" still present (line 294) |
| NEW-3 | MODERATE | Protocol_Biohacking still says "2,500 kcal/day to start" — contradicts ramp-up |
| NEW-4 | MINOR | Protocol weight increments "+2.5 kg upper / 5 kg lower" contradicts COACH |
| NEW-5 | MINOR | No pelvic floor screening in intake questionnaire |
| NEW-6 | MINOR | Archive contains outdated nut butter substitution with other nut butters |
| NEW-7 | MINOR | No partner cooking availability question in intake |

---

## Pass 6: Implementation Readiness

### Readiness Scorecard

| Dimension | Score | Ready? |
|-----------|-------|--------|
| Tech Stack Decision | 1/5 | No |
| Data Model | 2/5 | No |
| API Surface | 2/5 | No |
| System Prompts | 4/5 | Yes (with caveats) |
| Test Scenarios | 3/5 | Partially |
| Missing Specs | 2/5 | No |

### System Prompt Readiness per Agent

| Agent | Copy-Paste Ready? | Issues |
|-------|-------------------|--------|
| SCIENTIST | Yes | BMR example correct; Dev Plan/Protocol still carry wrong value |
| NUTRITIONIST | Yes | None blocking |
| DIETITIAN | Mostly | References external DIETITIAN_meal_template.md — won't resolve at runtime |
| CHEF | Mostly | References external batch_cooking.md and shake_recipes.md |
| COACH | Yes (caution) | ~400 lines — may exceed context window for some models |
| PHYSICIAN | Mostly | Input schema uses invalid JSON `\|` union syntax |

### Verdict: NOT READY

Domain knowledge layer: **Exceptional**. Engineering specification layer: **Absent**.

---

## Prioritized Action List

### P0 — Must Do Before Coding (~5-7 days)

| # | Action | Effort |
|---|--------|--------|
| 1 | Fix JSON schema field names across all agent files (normalize naming) | 2-3h |
| 2 | Write tech stack ADR (LangGraph vs CrewAI evaluation, LLM provider, cost estimate) | 1-2d |
| 3 | Design PostgreSQL schema from JSON schemas and intake questionnaire | 2-3d |
| 4 | Create INTER_AGENTS.md (pipeline execution model, error handling, retries) | 4-6h |
| 5 | Fix BMR cascading errors: 1,327 → 1,337 and all downstream values | 2-3h |
| 6 | Fix PHYSICIAN input schema JSON syntax (remove `\|` union notation) | 30min |

### P1 — Should Do Before Production (~4-6 days)

| # | Action | Effort |
|---|--------|--------|
| 7 | Define API contract (OpenAPI spec, auth, versioning, error model) | 2-3d |
| 8 | Resolve DIETITIAN/CHEF external file references in system prompts | 4-6h |
| 9 | Specify feedback loop implementation (data collection, triggers, cascade) | 1d |

### P2 — Important But Non-Blocking (~5-7 days)

| # | Action | Effort |
|---|--------|--------|
| 10 | Extract LEXICON.md from Dev Plan | 1-2h |
| 11 | Fix RULES.md violations: "nut butter" in meal template, imperial units | 2-3h |
| 12 | Fix all 4 shake recipe macro discrepancies | 1-2h |
| 13 | Fix carbohydrate targets per tier (280g → per-tier values) | 1h |
| 14 | Create test matrix and golden dataset (3-5 client profiles) | 2-3d |
| 15 | Multi-client generalization spec | 3-5d |

### P3 — Nice to Have

| # | Action | Effort |
|---|--------|--------|
| 16 | UI wireframes (intake, plan output, progress tracking) | 3-5d |
| 17 | COACH prompt optimization (token measurement, chunking strategy) | 4-6h |
| 18 | Food cost tiers (Flag 17) | 4-6h |
| 19 | Update CLAUDE.md agent count to 6 | 15min |
| 20 | Add missing health guardrails to CHEF, SCIENTIST, NUTRITIONIST | 2-3h |

---

## Appendix: Complete Finding Index

| ID | Pass | Severity | Title |
|----|------|----------|-------|
| P1-01 | 1 | CRITICAL | BMR miscalculation (1,327 vs 1,337) |
| P1-02 | 1 | CRITICAL | TDEE cascading errors |
| P1-03 | 1 | MINOR | Ramp-up surplus framing ambiguity |
| P1-04 | 1 | MINOR | Fat minimum below 25% floor |
| P1-05 | 1 | CRITICAL | Carbohydrate calculation error |
| P1-06 | 1 | MAJOR | Protein range floor inconsistent |
| P1-07 | 1 | CRITICAL | Shake 1 targets wrong |
| P1-08 | 1 | CRITICAL | Shake 2 targets wrong |
| P1-09 | 1 | CRITICAL | Shake 3 targets wrong |
| P1-10 | 1 | CRITICAL | Shake 4 targets wrong |
| P1-11 | 1 | CRITICAL | Systematic shake error pattern |
| P1-12 | 1 | MAJOR | Scaled portions wrong |
| P1-13 | 1 | MAJOR | Timeline inconsistency |
| P1-14 | 1 | MAJOR | JSON schema macro mismatch |
| P2-01 | 2 | CRITICAL | Somatotype in archive (low risk) |
| P2-03 | 2 | CRITICAL | "nut butters" in KNOWLEDGE_BASE |
| P2-04 | 2 | CRITICAL | "nut butter" in meal template (line 156) |
| P2-05 | 2 | CRITICAL | "nut butter" in meal template (line 176) |
| P2-06 | 2 | CRITICAL | "nut butter" in meal template (line 177) |
| P2-07 | 2 | CRITICAL | "nut butter" in meal template (line 192) |
| P2-10 | 2 | CRITICAL | Imperial units in KNOWLEDGE_BASE |
| P2-11 | 2 | CRITICAL | Imperial units in conversation_brief |
| P2-12 | 2 | MAJOR | Imperial conversion in initial.md |
| P2-13 | 2 | MAJOR | "cups" in CHEF_batch_cooking |
| P2-16 | 2 | MAJOR | Negative fat gain framing |
| P2-17 | 2 | MAJOR | Uncited DIETITIAN myth-busting |
| P2-20 | 2 | MAJOR | CHEF missing health guardrails |
| P2-21 | 2 | MAJOR | SCIENTIST missing RED-S/ED flags |
| P2-22 | 2 | MAJOR | NUTRITIONIST missing amenorrhea/RED-S |
| P4-01 | 4 | CRITICAL | No INTER_AGENTS.md |
| P4-03 | 4 | MAJOR | Agent count discrepancy (5 vs 6) |
| P4-04 | 4 | CRITICAL | Feedback loop underspecified |
| P4-05 | 4 | MAJOR | SCIENTIST no error handling |
| P4-06 | 4 | MAJOR | NUTRITIONIST adjustment logic incomplete |
| P4-07 | 4 | MAJOR | CHEF lacks recipe selection logic |
| P4-08 | 4 | CRITICAL | PHYSICIAN invocation contract missing |
| P4-10 | 4 | CRITICAL | No pipeline orchestration spec |
| P4-11 | 4 | MAJOR | SCIENTIST→NUTRITIONIST schema mismatch |
| P4-12 | 4 | MAJOR | NUTRITIONIST→DIETITIAN schema mismatch |
| P4-13 | 4 | MAJOR | COACH pipeline position ambiguity |
| P4-14 | 4 | CRITICAL | Weekly monitoring unspecified |
| P4-18 | 4 | MAJOR | PHYSICIAN no pause/resume mechanism |
| P6-01 | 6 | CRITICAL | No tech stack decision |
| P6-02 | 6 | CRITICAL | No PostgreSQL schema |
| P6-03 | 6 | CRITICAL | No API endpoint definitions |
| P6-04 | 6 | MAJOR | PHYSICIAN JSON syntax invalid |
| P6-05 | 6 | MAJOR | System prompts reference external files |
| P6-06 | 6 | MAJOR | COACH prompt may exceed context limits |
| P6-07 | 6 | MAJOR | No pipeline error handling spec |
| P6-08 | 6 | MAJOR | Single-client documentation only |
