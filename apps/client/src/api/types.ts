export interface Program {
  id: string;
  user_id: string;
  intake_response_id: string;
  status: "active" | "paused" | "completed" | "cancelled";
  current_phase: string;
  current_tier: string;
  current_week: number;
  started_at: string;
  target_weight_kg: number;
  current_weight_kg: number;
  target_intake_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  surplus_kcal: number;
}

export interface DashboardData {
  current_weight_kg: number;
  target_weight_kg: number;
  weekly_rate_avg: number;
  compliance_pct: number;
  days_on_program: number;
  current_phase: string;
  current_tier: string;
  recent_adjustments: {
    id: string;
    trigger_type: string;
    reason: string | null;
    created_at: string;
  }[];
}

export interface SlotSpec {
  protein_g: number;
  calories: number;
  carbs_g?: number;
  fat_g?: number;
  prep_time_max_min?: number;
  constraints?: string[];
}

export interface MealSlot {
  slot_spec: SlotSpec;
  primary_option: string | null;
  primary_protein?: string;
  cuisine_preference?: string;
  alternatives: { option: string | null; substitution_reasoning: string }[];
  compliance_risk: "low" | "medium" | "high";
  compliance_note: string;
}

export type DayTemplate = Record<string, MealSlot>;

export interface GeneratedRecipe {
  recipe_name: string;
  cuisine: string;
  servings: number;
  ingredients: { item: string; amount_g: number; prep_notes: string | null }[];
  macros_per_serving: { protein_g: number; fat_g: number; carbs_g: number; fiber_g?: number; calories: number };
  instructions: string[];
  time: { prep_min: number; cook_min: number };
  batch_notes?: string;
  storage?: { fridge_days: number; freezer_friendly: boolean };
  calorie_boost_options?: string[];
}

export interface MealPlanData {
  template: {
    weekly_template: Record<string, DayTemplate>;
    rotation_schedule: Record<string, Record<string, string>>;
  } | null;
  recipes: { recipes: GeneratedRecipe[] } | null;
}

export interface StoredRecipe {
  id: string;
  recipe_name: string;
  cuisine: string;
  servings: number;
  ingredients: { item: string; amount_g: number; prep_notes: string | null }[];
  macros_per_serving: { protein_g: number; fat_g: number; carbs_g: number; fiber_g?: number; calories: number };
  instructions: string[];
  time_prep: number;
  time_cook: number;
  batch_notes: string | null;
  verified: boolean;
  rating: number | null;
}

export interface RecipeGenerateResult {
  recipes_created: number;
  recipe_ids: string[];
  pipeline_run_id: string | null;
  rejected: { recipe_name: string; deviations: unknown[] }[];
}

export interface PhysicianAnswer {
  query_id: string;
  response: string;
  sources: { author: string; year: number; publication?: string; finding: string }[];
  mechanism_explained: string;
  timeline: string | null;
  referral_needed: boolean;
  referral_target: string | null;
  urgency: "routine" | "soon" | "urgent";
  pipeline_action: "continue" | "pause" | "abort";
  disclaimer: string;
}

export interface PhysicianQueryRow {
  id: string;
  query: string;
  response: Omit<PhysicianAnswer, "query_id"> | null;
  urgency: "routine" | "soon" | "urgent";
  created_at: string;
}

export interface ExerciseActualSet {
  weight_kg: number;
  reps: number;
  rpe?: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_sec: number;
  notes: string;
  target_rpe: number;
  progression_rule: string;
  target_weight_kg?: number;
  video_url?: string;
  actual?: ExerciseActualSet[];
}

export interface TrainingSession {
  id: string;
  program_id: string;
  week_number: number;
  day_of_week: string;
  focus: string;
  warmup: string[];
  exercises: Exercise[];
  status: "scheduled" | "completed" | "skipped" | "partial";
  completed_at: string | null;
  notes: string | null;
}

export interface CheckinResult {
  checkin_id: string;
  week_number: number;
  triggers_fired: string[];
  pipeline_run_id: string | null;
}
