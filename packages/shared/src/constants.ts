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
