import type Anthropic from "@anthropic-ai/sdk";

export interface RedFlagInput {
  symptom: string;
  duration_days: number;
  bmi: number;
  training_weeks: number;
}

export interface RedFlagOutput {
  urgency: "routine" | "soon" | "urgent";
  referral_target: string | null;
  pipeline_action: "continue" | "pause" | "abort";
  rationale: string;
}

export function classifyRedFlag(input: RedFlagInput): RedFlagOutput {
  const s = input.symptom.toLowerCase();

  if (s.includes("amenorrhea") && input.duration_days > 90) {
    return {
      urgency: "urgent",
      referral_target: "gynecologist or reproductive endocrinologist",
      pipeline_action: "pause",
      rationale: `Amenorrhea >3 months (${input.duration_days} days) at BMI ${input.bmi} indicates likely hypothalamic suppression from insufficient energy availability. Medical evaluation required to rule out other causes.`,
    };
  }

  if (
    s.includes("eating disorder") ||
    s.includes(" ed ") ||
    s === "ed" ||
    s.includes("restriction") ||
    s.includes("purging")
  ) {
    return {
      urgency: "urgent",
      referral_target: "psychologist specializing in eating disorders",
      pipeline_action: "pause",
      rationale: `Eating disorder indicators detected ("${input.symptom}"). Pipeline paused pending professional psychological evaluation.`,
    };
  }

  if (s.includes("pain") && input.duration_days > 7) {
    return {
      urgency: "soon",
      referral_target: "physiotherapist",
      pipeline_action: "continue",
      rationale: `Pain persisting ${input.duration_days} days exceeds normal DOMS window (2-3 days). Professional assessment recommended to rule out tissue injury.`,
    };
  }

  if (s.includes("pain") && input.duration_days <= 7) {
    return {
      urgency: "routine",
      referral_target: null,
      pipeline_action: "continue",
      rationale: `Pain duration (${input.duration_days} days) within normal adaptation window. Monitor for persistence beyond 7 days.`,
    };
  }

  if (
    s.includes("dizziness") &&
    (input.duration_days >= 7 || input.training_weeks < 4)
  ) {
    return {
      urgency: "soon",
      referral_target: "GP for cardiovascular assessment",
      pipeline_action: "continue",
      rationale: `Recurrent dizziness in underweight individual (BMI ${input.bmi}) with ${input.training_weeks} weeks training. Could indicate low blood pressure, blood sugar dysregulation, or iron deficiency.`,
    };
  }

  if (
    s.includes("cold intolerance") ||
    s.includes("fatigue") ||
    s.includes("hair")
  ) {
    return {
      urgency: "routine",
      referral_target: "GP for thyroid panel",
      pipeline_action: "continue",
      rationale: `Symptom "${input.symptom}" consistent with reduced T3 thyroid output from chronic energy insufficiency at BMI ${input.bmi}. Thyroid panel recommended if symptoms persist beyond 8 weeks of consistent surplus.`,
    };
  }

  return {
    urgency: "routine",
    referral_target: null,
    pipeline_action: "continue",
    rationale: `Symptom "${input.symptom}" noted. No immediate red flags identified. Monitor and report if symptoms worsen or persist.`,
  };
}

export interface SupplementSafetyInput {
  supplement_name: string;
}

export interface SupplementSafetyOutput {
  safety_profile: string;
  dose_range: string;
  contraindications: string[];
  interactions: string[];
}

const SUPPLEMENT_DB: Record<string, SupplementSafetyOutput> = {
  creatine: {
    safety_profile: "excellent",
    dose_range: "3-5g/day",
    contraindications: ["pre-existing kidney disease"],
    interactions: [],
  },
  vitamin_d3: {
    safety_profile: "good",
    dose_range: "2000-4000 IU/day",
    contraindications: ["hypercalcemia", "granulomatous diseases"],
    interactions: [],
  },
  magnesium: {
    safety_profile: "good",
    dose_range: "200-400mg/day",
    contraindications: ["severe renal impairment"],
    interactions: [],
  },
  omega_3: {
    safety_profile: "good",
    dose_range: "2-4g/day",
    contraindications: ["bleeding disorders"],
    interactions: ["anticoagulant medications"],
  },
  ashwagandha: {
    safety_profile: "moderate",
    dose_range: "300-600mg/day",
    contraindications: [
      "thyroid medications",
      "autoimmune conditions",
      "pregnancy",
    ],
    interactions: ["thyroid medications"],
  },
  collagen: {
    safety_profile: "excellent",
    dose_range: "10-15g/day",
    contraindications: [],
    interactions: [],
  },
};

export function lookupSupplementSafety(
  input: SupplementSafetyInput
): SupplementSafetyOutput {
  const key = input.supplement_name.toLowerCase().replace(/[\s-]+/g, "_");
  return (
    SUPPLEMENT_DB[key] ?? {
      safety_profile: "unknown",
      dose_range: "consult healthcare provider",
      contraindications: ["unknown — consult physician"],
      interactions: ["unknown — consult physician"],
    }
  );
}

export interface RefeedingRiskInput {
  bmi: number;
  recent_intake_pattern: "normal" | "reduced" | "severe_restriction";
}

export interface RefeedingRiskOutput {
  risk_level: "low" | "moderate" | "high";
  protocol: string;
  monitoring: string[];
}

export function assessRefeedingRisk(
  input: RefeedingRiskInput
): RefeedingRiskOutput {
  if (input.bmi < 16) {
    return {
      risk_level: "high",
      protocol: "inpatient medical supervision recommended",
      monitoring: [
        "all electrolytes",
        "cardiac monitoring",
        "daily weight",
      ],
    };
  }

  if (input.recent_intake_pattern === "severe_restriction") {
    return {
      risk_level: "high",
      protocol: "medical supervision required",
      monitoring: [
        "phosphate",
        "potassium",
        "magnesium",
        "calcium",
        "daily weight",
        "ECG",
      ],
    };
  }

  if (input.recent_intake_pattern === "reduced") {
    return {
      risk_level: "moderate",
      protocol: "gradual increase with electrolyte monitoring",
      monitoring: ["phosphate", "potassium", "magnesium"],
    };
  }

  return {
    risk_level: "low",
    protocol: "standard ramp-up safe",
    monitoring: [],
  };
}

export const toolExecutors: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  classify_red_flag: (input) =>
    classifyRedFlag(input as unknown as RedFlagInput),
  lookup_supplement_safety: (input) =>
    lookupSupplementSafety(input as unknown as SupplementSafetyInput),
  assess_refeeding_risk: (input) =>
    assessRefeedingRisk(input as unknown as RefeedingRiskInput),
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "classify_red_flag",
    description:
      "Classify a health symptom for urgency, referral target, and pipeline action. Used when red flags are detected by any agent or reported by the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        symptom: {
          type: "string",
          description:
            "Symptom description (e.g. 'amenorrhea', 'knee pain', 'eating disorder signs', 'cold intolerance')",
        },
        duration_days: {
          type: "number",
          description: "How many days the symptom has persisted",
        },
        bmi: { type: "number", description: "Current BMI" },
        training_weeks: {
          type: "number",
          description: "Number of weeks on training program",
        },
      },
      required: ["symptom", "duration_days", "bmi", "training_weeks"],
    },
  },
  {
    name: "lookup_supplement_safety",
    description:
      "Look up safety profile, dosing, contraindications, and interactions for a supplement. Covers creatine, vitamin_d3, magnesium, omega_3, ashwagandha, collagen.",
    input_schema: {
      type: "object" as const,
      properties: {
        supplement_name: {
          type: "string",
          description:
            "Supplement name (e.g. 'creatine', 'vitamin_d3', 'ashwagandha')",
        },
      },
      required: ["supplement_name"],
    },
  },
  {
    name: "assess_refeeding_risk",
    description:
      "Assess refeeding syndrome risk based on BMI and recent intake pattern. Determines monitoring requirements and protocol.",
    input_schema: {
      type: "object" as const,
      properties: {
        bmi: { type: "number", description: "Current BMI" },
        recent_intake_pattern: {
          type: "string",
          description: "Recent eating pattern",
          enum: ["normal", "reduced", "severe_restriction"],
        },
      },
      required: ["bmi", "recent_intake_pattern"],
    },
  },
];
