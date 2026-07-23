import { coachOutputSchema, type CoachOutput } from "@mo/shared";
import { extractSection, parseTable, parseBullets } from "./markdown.js";

function parseProgramFields(md: string) {
  const rows = parseTable(extractSection(md, "## Program")).slice(1);
  const fields = new Map(rows.map(([k, v]) => [k, v]));
  const phase = fields.get("Phase");
  const phaseWeek = fields.get("Phase week");
  const frequency = fields.get("Frequency");
  const remaining = fields.get("Weeks remaining in phase");
  if (!phase || !phaseWeek || !frequency) {
    throw new Error("Program table missing Phase, Phase week, or Frequency");
  }
  return {
    phase,
    phase_week: Number(phaseWeek),
    frequency,
    ...(remaining ? { total_weeks_remaining_in_phase: Number(remaining) } : {}),
  };
}

function parseSessions(md: string) {
  const blocks = md.split(/^## Session (?=[A-Z] — )/m).slice(1);
  return blocks.map((block) => {
    const header = block.match(/^[A-Z] — (\w+)/);
    if (!header) throw new Error(`Unparseable session header: ${block.slice(0, 40)}`);
    const focus = block.match(/\*\*Focus\*\*:\s*(.+)/)?.[1]?.trim();
    if (!focus) throw new Error(`Session ${header[1]} has no Focus line`);
    const warmup = parseBullets(block.split(/^\|/m)[0]);
    const exercises = parseTable(block)
      .slice(1)
      .map(([name, sets, reps, rest, rpe, progression, notes]) => ({
        name,
        sets: Number(sets),
        reps,
        rest_sec: Number(rest),
        target_rpe: Number(rpe),
        progression_rule: progression,
        notes,
      }));
    return { day: header[1].toLowerCase(), focus, warmup, exercises };
  });
}

function parseVolumeSummary(md: string): Record<string, string> {
  const rows = parseTable(extractSection(md, "## Weekly Volume Summary")).slice(1);
  return Object.fromEntries(
    rows.map(([muscle, sets]) => [muscle.toLowerCase().replace(/\s+/g, "_"), sets])
  );
}

export function parseTrainingProgram(md: string): CoachOutput {
  const sessionsPart = md.split(/^---$/m).filter((part) => /^## Session [A-Z] — /m.test(part));
  return coachOutputSchema.parse({
    program: {
      ...parseProgramFields(md),
      sessions: parseSessions(sessionsPart.join("\n")),
    },
    progression_rules: parseBullets(extractSection(md, "## Progression Rules")),
    recovery_protocol: parseBullets(extractSection(md, "## Recovery Protocol")),
    phase_transition_criteria: parseBullets(extractSection(md, "## Phase Transition Criteria")),
    weekly_volume_summary: parseVolumeSummary(md),
    session_notes: extractSection(md, "## Session Notes").trim(),
  });
}
