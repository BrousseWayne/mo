You are orchestrating a fact-check audit for a health/nutrition coaching system. Your role is to DELEGATE all heavy work (file reading, web searching) to subagents using the Task tool. Do NOT read files or run web searches yourself — that destroys the conversation context.

**Argument**: $ARGUMENTS

---

## Scope Resolution

Parse the argument to determine scope:

- **Empty** → full audit (all subagents, all target files)
- `citations` → launch Subagent A (extraction: CITATION only) + Subagent B (citations verification)
- `equations` → launch Subagent A (extraction: EQUATION + CONSTANT only) + Subagent C (equations verification)
- `food` → launch Subagent A (extraction: FOOD only) + Subagent D (food verification)
- `health` → launch Subagent A (extraction: HEALTH only) + Subagent E (health verification)
- `internal` → launch Subagent A (extraction: all categories + internal consistency)
- **File path** (contains `/` or `.md` or `.ts`) → full audit scoped to that single file

---

## Target Files

Pass this list to every subagent:

```
RULES.md
agents/*.md
agents/artifacts/*.md
knowledge/*.md
plans/CLIENT_PROFILE.md
packages/agents/src/tools/*.ts
packages/shared/src/constants.ts
```

Excluded: `archive/`, `node_modules/`, `audits/`, `.claude/`, `plans/` (except CLIENT_PROFILE.md)

If a single file path was given as argument, pass only that file.

---

## Execution Plan

### Step 1 — Launch subagents in parallel

Launch ALL applicable subagents simultaneously in a single message using the Task tool. Use `subagent_type: "general-purpose"` for all. Each subagent must be self-contained — include the target file list and full instructions in the prompt. Subagents are context-blind; they only see what you pass them.

---

**Subagent A — Claim Extraction + Internal Consistency**

Prompt must include:

Target files:
```
RULES.md, agents/*.md, agents/artifacts/*.md, knowledge/*.md, plans/CLIENT_PROFILE.md, packages/agents/src/tools/*.ts, packages/shared/src/constants.ts
```
Excluded: archive/, node_modules/, audits/, .claude/, plans/ (except CLIENT_PROFILE.md). If single-file mode, only that file.

Task — Claim Extraction:
Read every target file using Glob to discover paths, then Read to get contents. Extract and categorize each factual claim into one of these types:

| Category | What to look for |
|----------|-----------------|
| CITATION | "Author Year" or "Author et al. Year" paired with an attributed finding |
| EQUATION | Named formula (e.g., Mifflin-St Jeor, Harris-Benedict) with coefficients |
| CONSTANT | Specific numeric value with context: threshold, range, target, ratio |
| FOOD | Ingredient + stated macro/calorie value (protein g, carbs g, fat g, kcal per serving/100g) |
| HEALTH | Medical condition/symptom + threshold + recommended action/referral |
| MECHANISM | Biological mechanism description attributed to a source |

For each claim, record:
- `file`: source file path
- `line_approx`: approximate line number or section
- `category`: one of the above
- `claim_text`: the exact or summarized claim
- `source_cited`: what source the document attributes this to (if any)

Task — Internal Consistency:
Cross-reference claims that appear in multiple files:
1. Same citation, different files: does the attributed finding match across all occurrences?
2. Same constant, different files: do numeric values match? Examples: protein range (g/kg) in RULES.md vs agent specs vs knowledge files; activity multipliers in constants.ts vs knowledge files; BMR equation coefficients in tool code vs agent specs.
3. Same equation, different files: do all coefficients match the same version?
4. Health thresholds: do RULES.md, PHYSICIAN.md, and pipeline.md agree on referral triggers?

Use compliance hierarchy to determine which file is authoritative when conflicts exist:
1. RULES.md (absolute authority)
2. agents/*.md
3. plans/CLIENT_PROFILE.md
4. agents/pipeline.md
5. agents/artifacts/*.md
6. knowledge/*.md
7. packages/ code

Flag each discrepancy as CONTRADICTION with both values and which file holds authority.

Return format: JSON with:
- `counts`: object with count per category (CITATION, EQUATION, CONSTANT, FOOD, HEALTH, MECHANISM)
- `contradictions`: array of `{claim, file_a, value_a, file_b, value_b, authoritative_file, authoritative_value}`
- `claims`: array of `{file, line_approx, category, claim_text, source_cited}`

Keep the response under 4000 words — be compact.

---

**Subagent B — Scientific Citations Verification** (skip if scope excludes citations)

Prompt must include:

Target files:
```
RULES.md, agents/*.md, agents/artifacts/*.md, knowledge/*.md, plans/CLIENT_PROFILE.md
```
Excluded: archive/, node_modules/, audits/, .claude/. If single-file mode, only that file.

Task:
Read target files and extract all CITATION claims (pattern: "Author Year" or "Author et al. Year" paired with an attributed finding).

For each unique CITATION claim:
1. Search: Use WebSearch with query: `"{Author} {Year}" {key_finding_terms} site:pubmed.ncbi.nlm.nih.gov`
   - If no results, retry without site restriction: `"{Author} {Year}" {key_finding_terms} PubMed`
   - If still no results, try Google Scholar as fallback: `"{Author} {Year}" {key_finding_terms} Google Scholar`
2. Fetch: Use WebFetch on the PubMed abstract or publisher page to read the actual findings
3. Compare: Does the paper actually report what the documentation claims?

Verify:
- Author name and year are correctly paired
- The claimed finding matches the actual reported finding (not overstated or misattributed)
- Study design description is accurate if mentioned (sample size, population)
- Quoted statistics are accurate (effect sizes, p-values, confidence intervals)

Do NOT flag if:
- Minor phrasing differences that preserve meaning
- The claim is a reasonable summary of a complex finding

DO flag if:
- Finding attributed to wrong author/study
- Year is wrong by more than 1 year
- Claimed effect size or direction is wrong
- Important caveats are omitted that change the meaning
- Study was in a different population than implied

Rate each citation: VERIFIED, INACCURATE (with details), or UNVERIFIABLE (source not found).

If a WebFetch fails or returns irrelevant content, note the claim as UNVERIFIABLE rather than retrying indefinitely. PubMed is the primary source. Google Scholar is the fallback.

Return format: JSON array of `{file, line_approx, claim_text, source_cited, rating, details, source_url}`

Keep the response under 4000 words.

---

**Subagent C — Equations & Constants Verification** (skip if scope excludes equations)

Prompt must include:

Target files:
```
RULES.md, agents/*.md, knowledge/*.md, packages/agents/src/tools/*.ts, packages/shared/src/constants.ts
```
Excluded: archive/, node_modules/, audits/, .claude/. If single-file mode, only that file.

Task — Equations:
Read target files and extract all EQUATION claims (named formulas with coefficients).

For each EQUATION:
1. WebSearch: `"{equation_name}" original coefficients {author} {year}`
2. Compare each coefficient in the codebase/docs against the published original
3. Flag any coefficient that differs from the canonical version

The original publication is the gold standard. Textbook reproductions are acceptable secondary sources.

Common equations to verify:
- Mifflin-St Jeor (1990): 10 x weight(kg) + 6.25 x height(cm) - 5 x age - 161 (female)
- Activity multipliers (sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very active 1.9)
- Protein targets (g/kg ranges for muscle gain)

Task — Constants:
Extract all CONSTANT claims (specific numeric thresholds, ranges, ratios with context).

For each CONSTANT:
1. Identify the cited source
2. WebSearch to verify the value against the source or authoritative references
3. Flag discrepancies with the correct value

Return format: JSON array of `{file, line_approx, type, claim_text, expected_value, found_value, status, source_url}` where type is EQUATION or CONSTANT and status is VERIFIED, INACCURATE, or UNVERIFIABLE.

Keep the response under 3000 words.

---

**Subagent D — Food Composition Verification** (skip if scope excludes food)

Prompt must include:

Target files:
```
packages/agents/src/tools/ingredients.ts, agents/artifacts/*.md, knowledge/*.md
```
Also scan: agents/CHEF.md, agents/DIETITIAN.md, agents/NUTRITIONIST.md for any inline food data. If single-file mode, only that file.

Task:
Read target files and extract all FOOD claims: ingredient + stated macro/calorie values (protein g, carbs g, fat g, kcal per serving or per 100g).

For each FOOD claim:
1. Use WebSearch: `"{ingredient}" nutrition facts site:fdc.nal.usda.gov`
   - Or WebFetch on USDA FoodData Central: `https://fdc.nal.usda.gov/search?query={ingredient_name}`
2. Compare stated values against USDA reference values
3. Calculate percentage deviation for each macro

USDA FoodData Central is the primary reference. If USDA doesn't have an entry, note as UNVERIFIABLE.

Flag thresholds:
- Deviation >25% from USDA → HIGH severity
- Deviation 10-25% from USDA → MEDIUM severity
- Deviation <10% → acceptable, do not flag

Compare on same unit basis (per 100g, per serving, etc.). Convert if units differ before calculating deviation.

Return format: JSON array of `{file, line_approx, ingredient, unit_basis, claimed_values: {protein, carbs, fat, kcal}, usda_values: {protein, carbs, fat, kcal}, max_deviation_pct, severity}`

Keep the response under 3000 words.

---

**Subagent E — Health Thresholds Verification** (skip if scope excludes health)

Prompt must include:

Target files:
```
RULES.md, agents/PHYSICIAN.md, agents/pipeline.md, knowledge/*.md
```
Also scan: agents/SCIENTIST.md, agents/COACH.md for health-related thresholds. If single-file mode, only that file.

Task:
Read target files and extract all HEALTH claims: medical condition/symptom + threshold value + recommended action/referral.

For each HEALTH claim:
1. WebSearch: `"{condition}" clinical threshold guidelines {relevant_organization}`
   - Organizations to check: ACSM, ISSN, IOC, Endocrine Society, WHO
2. Verify:
   - Threshold values match current clinical guidelines
   - Referral targets are appropriate for the condition
   - RED-S criteria match IOC consensus statement (2014 or 2023 update)
   - Amenorrhea definition and threshold are clinically accurate
   - Training pain duration thresholds are evidence-based

Flag if:
- Threshold is outdated (superseded by newer guidelines)
- Referral target is inappropriate for the condition
- Missing critical warning signs that guidelines recommend screening for

Return format: JSON array of `{file, line_approx, condition, claimed_threshold, claimed_action, guideline_value, guideline_source, status}` where status is VERIFIED, INACCURATE (with details), or UNVERIFIABLE.

Keep the response under 3000 words.

---

### Step 2 — Collect results

Wait for all subagents to complete. Read each result.

### Step 3 — Assemble report

Combine all subagent results into this exact format:

```
## Fact-Check Report — [today's date]

### Summary
- Files scanned: N
- Claims extracted: N (X CITATION, Y EQUATION, Z CONSTANT, W FOOD, V HEALTH, U MECHANISM)
- Verified accurate: N
- Issues found: N (X critical, Y high, Z medium, W low)
- Internal contradictions: N

### Critical Issues
| File | Line | Category | Claim | Finding | Source |
|------|------|----------|-------|---------|--------|

### High Issues
| File | Line | Category | Claim | Finding | Source |
|------|------|----------|-------|---------|--------|

### Medium Issues
| File | Line | Category | Claim | Finding | Source |
|------|------|----------|-------|---------|--------|

### Low Issues
| File | Line | Category | Claim | Finding | Source |
|------|------|----------|-------|---------|--------|

### Internal Contradictions
| Claim | File A (value) | File B (value) | Authoritative Value | Resolution |
|-------|---------------|---------------|--------------------:|------------|

### Verified Claims (sample)
[List up to 10 representative verified claims as confidence examples]

### Unverifiable Claims
[Claims where no external source could be found to confirm or deny]

### Verdict: [CLEAN | N issues (X critical, Y high)]
```

If a section has no entries, write "None" in that section.

---

## Severity Classification

| Level | Definition | Examples |
|-------|-----------|----------|
| CRITICAL | Could cause harm if acted upon | Wrong health threshold, wrong equation coefficients, misattributed finding that reverses meaning |
| HIGH | Meaningfully misleading | Constant off >10%, finding attributed to wrong study, missing important caveats |
| MEDIUM | Imprecise but not harmful | Food macros off 10-25%, approximate language where precision exists, minor citation detail wrong |
| LOW | Cosmetic/minor | Citation year off by 1, unnecessary hedging, style inconsistency in attribution |

---

## Rules

- Do NOT read any files yourself. All file reading happens inside subagents.
- Do NOT run WebSearch or WebFetch yourself. All web lookups happen inside subagents.
- Launch subagents in parallel where possible (all of A/B/C/D/E can run simultaneously since each subagent does its own extraction from files).
- This is a read-only audit. No files are modified.
- Tell the user which subagents you're launching and their scope before launching them.
- Be thorough but efficient. Batch WebSearch calls where possible within each subagent.
- Report progress as subagents complete.
