You are orchestrating a documentation sync audit. Your role is to DELEGATE all heavy work (file reading, filesystem scanning, cross-referencing) to subagents using the Task tool. Do NOT read files yourself — that destroys the conversation context.

Do NOT modify any files. Only report discrepancies.

---

## Execution Plan

### Step 1 — Launch all audit subagents in parallel

Launch ALL subagents simultaneously in a single message using the Task tool. Use `subagent_type: "general-purpose"` for all. Each subagent must be self-contained with full instructions.

**Subagent 1 — File Structure Audit**

Prompt must include:
- Read the `## File Structure` section from CLAUDE.md
- Scan the actual filesystem using Glob:
  - Root: `*.md`, `*.json`, `*.yaml`, `*.yml`, `docker-compose.yml`
  - `packages/shared/src/**/*.ts`
  - `packages/database/src/**/*.ts`, `packages/database/drizzle.config.ts`
  - `packages/agents/src/**/*.ts`
  - `apps/api/src/**/*.ts`
  - `agents/*.md`, `agents/artifacts/*.md`
  - `plans/*.md`, `knowledge/*.md`, `audits/*.md`
  - `archive/**/*`
- Compare the two lists
- Ignore: `node_modules/`, `dist/`, `.git/`, `.env`, `.claude/`, `pnpm-lock.yaml`, `.gitignore`, `*.tsbuildinfo`
- Return format: JSON with `missing_from_docs` array (files on disk not in CLAUDE.md) and `stale_in_docs` array (entries in CLAUDE.md with no file on disk)
- Keep response under 2000 words

**Subagent 2 — TRACKER.md Status Audit**

Prompt must include:
- Read TRACKER.md
- For each `[x]` item referencing a file path: verify the file exists using Glob. If missing, flag as "Completed but file missing"
- For each `[ ]` item referencing a file path: check if the file now exists. If it does, flag as "Stale todo — file already exists"
- `[~]` (archived): skip
- `[-]` (in progress): note for info only
- Return format: JSON array of `{item, status, issue, file_path}`
- Keep response under 2000 words

**Subagent 3 — Cross-Reference Integrity Audit**

Prompt must include:
- Read `agents/pipeline.md` — verify it references all 6 agent specs and those files exist in `agents/`
- Read `agents/CHEF.md` — verify referenced knowledge files exist in `knowledge/`
- Read `agents/DIETITIAN.md` — verify `agents/artifacts/dietitian-meal-template.md` exists
- Read `CLAUDE.md` — verify RULES.md, TRACKER.md, and plans/ references resolve
- Scan all `agents/*.md` for markdown links or file path references (patterns: `](path)`, `./path`, `agents/artifacts/`, `knowledge/`, `plans/`). Verify each exists.
- Check `CLAUDE.md` Compliance Hierarchy entries point to existing paths
- Return format: JSON array of `{source_file, referenced_path, status}` where status is "OK" or "NOT_FOUND"
- Keep response under 2000 words

**Subagent 4 — RULES.md Compliance Spot-Check**

Prompt must include:
- Read RULES.md sections 2 (Banned Terminology) and 4 (Food Constraints)
- Scan these files (NOT `archive/`): `agents/*.md`, `agents/artifacts/*.md`, `knowledge/*.md`, `plans/*.md`, `CLAUDE.md`, `TRACKER.md`
- Search for banned terms: `ectomorph`, `mesomorph`, `endomorph`, `somatotype` (prescriptive), `fast metabolism`, `slow metabolism`, `anabolic window`, `toning` (exercise goal), `long lean muscles`, `spot reduction`, `starvation mode`
- Search for non-metric units: `lbs`, `oz` (weight), `inches`, `cups` (measurement), `Fahrenheit`
- Search for `peanut butter` outside of exclusion/ban context
- Contextual exceptions (do NOT flag): RULES.md itself, sentences saying a term is banned/excluded, correct alternatives table entries
- Return format: JSON array of `{file, line_approx, violation, context}`
- Keep response under 2000 words

**Subagent 5 — Stale Document Detection**

Prompt must include:
- Check if `plans/*.md` describe things implemented differently than actual code in `packages/` and `apps/` (read plan docs and compare with code structure)
- Check if `archive/` files are still referenced by any active (non-archive) document
- Check if `agents/*.md` I/O schema field names align with Zod schemas in `packages/shared/src/schemas/`. Flag obvious mismatches.
- Return format: JSON with `stale_plans` array, `archive_still_referenced` array, `schema_mismatches` array
- Keep response under 2000 words

### Step 2 — Collect results

Wait for all subagents to complete. Read each result.

### Step 3 — Assemble report

Combine all subagent results into this exact format:

```
## Sync Report — [today's date]

### 1. File Structure (CLAUDE.md)
- MISSING from File Structure: [list each file on disk not documented, or "None"]
- STALE in File Structure: [list each entry with no file on disk, or "None"]

### 2. TRACKER.md
- Status mismatches: [list items where checkbox doesn't match reality, or "None"]

### 3. Cross-References
- Broken links: [list each broken reference, or "None"]

### 4. RULES.md Compliance
- Violations found: [list each violation with file and term, or "None"]

### 5. Stale Documents
- [list docs that may need updating, or "None"]

### Verdict: [CLEAN | N issues found]
```

Count total issues across all sections for the verdict. "CLEAN" only if zero issues.

---

## Rules

- Do NOT read any files yourself. All file reading happens inside subagents.
- Launch all 5 subagents in parallel in a single message.
- This is a read-only audit. No files are modified.
- Tell the user which subagents you're launching before launching them.
