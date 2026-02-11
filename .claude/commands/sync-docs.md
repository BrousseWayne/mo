You are a documentation auditor. Perform a comprehensive sync audit of this repository. Do NOT modify any files. Only report discrepancies.

Execute all 6 audits below, then output the structured report at the end.

---

## Audit 1: File Structure (CLAUDE.md)

Read the `## File Structure` section from CLAUDE.md. It contains a tree of every file the project claims to have.

Then scan the actual filesystem:
- Root: `*.md`, `*.json`, `*.yaml`, `*.yml`, `docker-compose.yml`
- `packages/shared/src/**/*.ts`
- `packages/database/src/**/*.ts`, `packages/database/drizzle.config.ts`
- `packages/agents/src/**/*.ts`
- `apps/api/src/**/*.ts`
- `agents/*.md`
- `agents/artifacts/*.md`
- `plans/*.md`
- `knowledge/*.md`
- `audits/*.md`
- `archive/**/*`

Compare the two lists. Report:
- **MISSING from File Structure**: files that exist on disk but are not listed in CLAUDE.md's File Structure
- **STALE in File Structure**: entries listed in CLAUDE.md's File Structure but with no corresponding file on disk

Ignore: `node_modules/`, `dist/`, `.git/`, `.env`, `.claude/`, `pnpm-lock.yaml`, `.gitignore`, `*.tsbuildinfo`

---

## Audit 2: TRACKER.md Status

Read TRACKER.md. For each checkbox item:

1. Items marked `[x]` (done) that reference a specific file path: verify the file exists on disk. If the file is missing, report as "Completed but file missing".
2. Items marked `[ ]` (todo) that reference a specific file path: check if the file now exists. If it does, report as "Stale todo — file already exists".
3. Items marked `[~]` (archived): no action needed.
4. Items marked `[-]` (in progress): note for informational purposes only.

---

## Audit 3: Cross-Reference Integrity

Check that inter-document references resolve to existing files:

1. Read `agents/pipeline.md` — does it reference all 6 agent specs (SCIENTIST, NUTRITIONIST, DIETITIAN, CHEF, COACH, PHYSICIAN)? Do those files exist in `agents/`?
2. Read `agents/CHEF.md` — it references knowledge files (food-science.md, cooking-techniques.md, flavor-science.md, cuisine-profiles.md). Do they all exist in `knowledge/`?
3. Read `agents/DIETITIAN.md` — it references `agents/artifacts/dietitian-meal-template.md`. Does it exist?
4. Read `CLAUDE.md` — it references RULES.md, TRACKER.md, and files in plans/. Do they all exist?
5. Scan all `agents/*.md` files for any markdown links or file path references (patterns like `](path)`, `./path`, `agents/artifacts/`, `knowledge/`, `plans/`). Verify each referenced file exists.
6. Check that `CLAUDE.md`'s Compliance Hierarchy entries all point to existing paths/patterns.

Report any broken references as: `[source file] → [referenced path] — NOT FOUND`

---

## Audit 4: RULES.md Compliance Spot-Check

Read RULES.md sections 2 (Banned Terminology) and 4 (Food Constraints).

Scan these files (NOT files in `archive/`):
- `agents/*.md`
- `agents/artifacts/*.md`
- `knowledge/*.md`
- `plans/*.md`
- `CLAUDE.md`, `TRACKER.md`

Search for:
- Banned terms: `ectomorph`, `mesomorph`, `endomorph`, `somatotype` (as prescriptive), `fast metabolism`, `slow metabolism`, `anabolic window`, `toning` (as exercise goal), `long lean muscles`, `spot reduction`, `starvation mode`
- Non-metric units outside of archived files: `\blbs?\b`, `\boz\b` (as weight), `\binches?\b`, `\bcups?\b` (as measurement), `Fahrenheit`
- Peanut butter: any mention of `peanut butter` outside of exclusion/ban context (i.e., not in a sentence that says it's excluded or banned)

For each violation found, report: `[file]:[line number approximate] — [the banned term or violation]`

Contextual exceptions (do NOT flag these):
- RULES.md itself (it defines the banned terms)
- Sentences explicitly saying a term is banned/excluded/forbidden
- Correct alternatives table entries

---

## Audit 5: Stale Document Detection

1. Check if any `plans/*.md` describe things that are now implemented differently than what's in code (compare plan descriptions with actual code in `packages/` and `apps/`).
2. Check if `archive/` files are still referenced by any active (non-archive) document.
3. Check if `agents/*.md` I/O schemas mention field names that should align with Zod schemas in `packages/shared/src/schemas/`. Flag obvious mismatches if found.

---

## Audit 6: Report

After completing all audits, output this exact format:

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

Count total issues across all sections for the verdict. "CLEAN" only if zero issues in every section.
