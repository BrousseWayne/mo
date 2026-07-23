export const AGENTS = ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"] as const;
export type AgentName = (typeof AGENTS)[number];

export const PHYSICIAN_AGENT = "PHYSICIAN" as const;

export const AGENT_COLORS: Record<AgentName | typeof PHYSICIAN_AGENT, string> = {
  SCIENTIST: "#457B9D",
  NUTRITIONIST: "#2A9D8F",
  DIETITIAN: "#F4A261",
  CHEF: "#E9C46A",
  COACH: "#9B5DE5",
  PHYSICIAN: "#E63946",
};

export const CLAUDE_MODELS = {
  pipeline: "claude-sonnet-4-5-20250929",
  physician: "claude-haiku-4-5-20251001",
} as const;

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  pre_training: 1.3,
  active_training: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_FACTORS;

export const PROTEIN_RANGE = { min: 1.6, max: 2.0 } as const;
export const FAT_MIN_PERCENT = 0.25;
export const FIBER_MIN_G = 20;
export const HYDRATION_RANGE = { min: 2.0, max: 2.5 } as const;
export const WEIGHT_GAIN_RATE = { min: 0.25, max: 0.5 } as const;
export const SURPLUS_RANGE = { min: 400, max: 500 } as const;
export const ADAPTATION_WEEKS = 4;

export const FDC_NUTRIENT_IDS = {
  energy: 1008,
  energy_atwater_general: 2047,
  energy_atwater_specific: 2048,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
  calcium: 1087,
  iron: 1089,
  vitamin_d: 1114,
  vitamin_b12: 1178,
  folate_dfe: 1190,
} as const;

export const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
export const FDC_RATE_LIMIT = 1000;
export const FDC_RATE_WINDOW_MS = 3_600_000;

export const TRIGGER_THRESHOLDS = {
  min_weekly_gain: 0.25,
  max_weekly_gain: 0.75,
  calorie_increase: 200,
  calorie_decrease: 150,
  waist_hip_weeks: 4,
  stall_sessions: 3,
  stall_lifts: 2,
  milestone_interval_kg: 5,
  protein_recalc_days: 30,
  compliance_mvd_threshold: 2,
} as const;

export const RE_EXECUTION_MAP: Record<string, { rerun: string[]; skip: string[] }> = {
  insufficient_gain: { rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"] },
  excessive_gain: { rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"] },
  waist_hip_flag: { rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"], skip: [] },
  training_stall: { rerun: ["COACH"], skip: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"] },
  weight_milestone: { rerun: ["SCIENTIST", "NUTRITIONIST"], skip: ["DIETITIAN", "CHEF", "COACH"] },
  protein_recalc: { rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"] },
  compliance: { rerun: ["DIETITIAN", "CHEF"], skip: ["SCIENTIST", "NUTRITIONIST", "COACH"] },
  tier_progression: { rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"] },
  phase_transition: { rerun: ["SCIENTIST", "COACH"], skip: ["NUTRITIONIST", "DIETITIAN", "CHEF"] },
};
