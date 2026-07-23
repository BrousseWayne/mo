export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "rpe",
    term: "RPE (Rating of Perceived Exertion)",
    definition:
      "A 1-10 scale for how hard a set felt. RPE 7 means you could have done about 3 more reps with good form; RPE 9 means only 1 rep was left. Rating every set teaches you to gauge effort honestly and lets the program adjust loads from your logs instead of guesswork. Most working sets in this program sit at RPE 7-8.",
  },
  {
    id: "minimum-viable-day",
    term: "Minimum viable day",
    definition:
      "The fallback version of a day when cooking or appetite fails: about 1800 kcal and 85 g protein from the simplest possible options (shakes, batch-cooked components, no-prep foods). Hitting a minimum viable day is a success, not a failure — consistency at a lower level beats skipped days. Your weekly check-in counts these days, and sustained consistency unlocks the next calorie tier.",
  },
  {
    id: "phase",
    term: "Training phase",
    definition:
      "The program advances through phases: Phase 0 (Gym Introduction — two weeks of movement learning with light loads and no load progression), Phase 1 (Foundation — 3x/week full body with progressive overload), Phase 2 (Hypertrophy — 4x/week upper/lower split with more volume). You move up when the phase's completion criteria are met, and the transition happens automatically at check-in.",
  },
  {
    id: "tier",
    term: "Calorie tier",
    definition:
      "Calorie targets step up gradually so appetite can keep pace. Tier 0 scales meals to roughly 2100 kcal with the snack slot as a shake; Tier 1 raises the day to roughly 2300 kcal with extra energy-dense additions; Tier 2 is the full calculated target. You progress a tier after 3 consecutive weeks with 5 or more minimum viable days — proof the current level is sustainable.",
  },
  {
    id: "surplus",
    term: "Surplus",
    definition:
      "Calories eaten above what your body burns each day (400-500 kcal here). The surplus is the raw material for building mass: muscle, plus the body fat that is a desired outcome at a low starting body weight — it restores energy reserves and supports hormonal health. It translates to roughly 0.25-0.5 kg gained per week, gradual and fully controllable.",
  },
  {
    id: "ramp-up",
    term: "Ramp-up",
    definition:
      "The first weeks ease intake upward instead of jumping straight to the full target: week 1 adds about 300 kcal over your baseline (one extra shake), week 2 adds about 500 kcal, and from week 3 you eat the full 5-meal template. This gives appetite and digestion time to adapt so the plan stays comfortable.",
  },
  {
    id: "casein",
    term: "Casein",
    definition:
      "The slow-digesting protein in milk products (the pre-sleep slot uses it, e.g. skyr or cottage cheese). It releases amino acids for hours, which keeps muscle protein synthesis supplied overnight — useful when the goal is building mass and the night is the longest gap between meals.",
  },
  {
    id: "follicular",
    term: "Follicular phase",
    definition:
      "The part of the cycle from the first day of your period to ovulation. Estrogen rises through this window and many women feel their strongest here — a good time to push training. Logging your cycle phase at check-in helps separate real weight trends from normal cycle fluctuation.",
  },
  {
    id: "luteal",
    term: "Luteal phase",
    definition:
      "The part of the cycle between ovulation and the next period. Body temperature, appetite and water retention typically rise, so the scale can jump 0.5-1.5 kg without any change in actual tissue. Expect it, log the phase at check-in, and judge progress on the multi-week trend, not a single weigh-in.",
  },
  {
    id: "menstrual",
    term: "Menstrual phase",
    definition:
      "The days of your period, the start of a new cycle. Energy can dip and iron losses are highest in this window — keep protein and iron-rich meals consistent, and train if energy allows; lighter sessions still count. Water retention from the late luteal phase usually releases here, so the scale often drops.",
  },
  {
    id: "progressive-overload",
    term: "Progressive overload",
    definition:
      "Gradually asking slightly more of your muscles over time — more reps, then more weight. It is the engine of muscle growth: the body adapts to what it is asked to do, so the ask has to rise. In this program the increments are small and prescribed (+1 kg on upper-body lifts, +2.5 kg on lower-body lifts), never heroic jumps.",
  },
  {
    id: "double-progression",
    term: "Double progression",
    definition:
      "The specific overload method used here. Each exercise has a rep range (e.g. 8-12): you first progress reps within the range, and once you hit the top of the range on all sets with good form, you add the small prescribed increment and drop back to the bottom of the range. Your logged sets drive next week's targets automatically.",
  },
  {
    id: "batch-cooking",
    term: "Batch cooking",
    definition:
      "Cooking components in bulk on scheduled sessions (rice, proteins, sauces for several days), so weekday meals become assembly instead of cooking. It is the main compliance tool in the meal plan: the fewer decisions and pans a meal needs on a tired evening, the more likely it happens.",
  },
  {
    id: "mps",
    term: "MPS (Muscle Protein Synthesis)",
    definition:
      "The process of building new muscle protein. Training switches it on for roughly 24-48 hours, and each protein-rich meal (about 25-40 g) triggers a fresh pulse — which is why the plan spreads protein across 5 meals instead of concentrating it. Total daily protein and consistency matter most; timing details are secondary.",
  },
];
