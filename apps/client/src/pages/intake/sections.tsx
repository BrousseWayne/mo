import { ChoiceField, NumberField, SliderField, ToggleField, TextField } from "../../components/fields";

export interface IntakeForm {
  age: string;
  height_cm: string;
  current_weight_kg: string;
  target_weight_kg: string;
  training_status?: string;
  training_frequency_per_week: number;
  equipment_access?: string;
  gym_anxiety_level?: string;
  estimated_daily_calories: string;
  appetite_level?: string;
  cooking_skill?: string;
  partner_cooks: boolean;
  extra_aversions: string;
  menstrual_cycle_length?: string;
  cycle_tracking: boolean;
  daily_step_count?: string;
  sleep_hours: number;
  stress_level: number;
  previous_weight_gain_attempts: string;
  medications: string;
  conditions: string;
  injuries: string;
}

export const INITIAL_FORM: IntakeForm = {
  age: "",
  height_cm: "",
  current_weight_kg: "",
  target_weight_kg: "",
  training_frequency_per_week: 3,
  estimated_daily_calories: "",
  partner_cooks: false,
  extra_aversions: "",
  cycle_tracking: false,
  sleep_hours: 7,
  stress_level: 5,
  previous_weight_gain_attempts: "",
  medications: "",
  conditions: "",
  injuries: "",
};

interface SectionProps {
  form: IntakeForm;
  update: <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => void;
}

export function BasicsSection({ form, update }: SectionProps) {
  return (
    <>
      <h2>About you</h2>
      <NumberField label="Age" hint="years" value={form.age} onChange={(v) => update("age", v)} />
      <NumberField label="Height" hint="cm" value={form.height_cm} onChange={(v) => update("height_cm", v)} />
      <NumberField
        label="Current weight"
        hint="kg"
        value={form.current_weight_kg}
        onChange={(v) => update("current_weight_kg", v)}
      />
      <NumberField
        label="Target weight"
        hint="kg — gaining is the goal here"
        value={form.target_weight_kg}
        onChange={(v) => update("target_weight_kg", v)}
      />
    </>
  );
}

export function TrainingSection({ form, update }: SectionProps) {
  return (
    <>
      <h2>Training</h2>
      <ChoiceField
        label="Structured resistance training experience"
        options={[
          { value: "none", label: "None yet" },
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
        ]}
        value={form.training_status}
        onChange={(v) => update("training_status", v)}
      />
      <SliderField
        label="Days per week you can train"
        min={0}
        max={7}
        value={form.training_frequency_per_week}
        onChange={(v) => update("training_frequency_per_week", v)}
      />
      <ChoiceField
        label="Equipment access"
        options={[
          { value: "commercial_gym", label: "Commercial gym" },
          { value: "home_full", label: "Home — full setup" },
          { value: "home_minimal", label: "Home — minimal" },
          { value: "both", label: "Gym + home" },
        ]}
        value={form.equipment_access}
        onChange={(v) => update("equipment_access", v)}
      />
      <ChoiceField
        label="How comfortable do you feel in a gym?"
        options={[
          { value: "low", label: "Comfortable" },
          { value: "moderate", label: "A bit anxious" },
          { value: "high", label: "Very anxious" },
        ]}
        value={form.gym_anxiety_level}
        onChange={(v) => update("gym_anxiety_level", v)}
      />
    </>
  );
}

export function NutritionSection({ form, update }: SectionProps) {
  return (
    <>
      <h2>Food & appetite</h2>
      <NumberField
        label="Estimated current daily calories"
        hint="rough guess is fine"
        value={form.estimated_daily_calories}
        onChange={(v) => update("estimated_daily_calories", v)}
      />
      <ChoiceField
        label="Appetite level"
        options={[
          { value: "low", label: "Low" },
          { value: "moderate", label: "Moderate" },
          { value: "high", label: "High" },
        ]}
        value={form.appetite_level}
        onChange={(v) => update("appetite_level", v)}
      />
      <ChoiceField
        label="Cooking skill"
        options={[
          { value: "none", label: "None" },
          { value: "basic", label: "Basic" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ]}
        value={form.cooking_skill}
        onChange={(v) => update("cooking_skill", v)}
      />
      <ToggleField
        label="Does a partner cook for you?"
        value={form.partner_cooks}
        onChange={(v) => update("partner_cooks", v)}
      />
      <TextField
        label="Other food aversions"
        hint="comma-separated; peanut butter and nut butters are already excluded"
        value={form.extra_aversions}
        onChange={(v) => update("extra_aversions", v)}
        placeholder="e.g. cilantro, shellfish"
      />
    </>
  );
}

export function CycleSection({ form, update }: SectionProps) {
  return (
    <>
      <h2>Menstrual cycle</h2>
      <ChoiceField
        label="Typical cycle length"
        options={[
          { value: "under_21", label: "Under 21 days" },
          { value: "21_25", label: "21–25 days" },
          { value: "26_30", label: "26–30 days" },
          { value: "31_35", label: "31–35 days" },
          { value: "over_35", label: "Over 35 days" },
          { value: "irregular", label: "Irregular" },
          { value: "amenorrhea", label: "No period (3+ months)" },
          { value: "hormonal_contraception", label: "Hormonal contraception" },
          { value: "postmenopausal", label: "Postmenopausal" },
        ]}
        value={form.menstrual_cycle_length}
        onChange={(v) => update("menstrual_cycle_length", v)}
      />
      <ToggleField
        label="Do you track your cycle?"
        value={form.cycle_tracking}
        onChange={(v) => update("cycle_tracking", v)}
      />
    </>
  );
}

export function LifestyleSection({ form, update }: SectionProps) {
  return (
    <>
      <h2>Lifestyle</h2>
      <ChoiceField
        label="Daily activity (steps)"
        options={[
          { value: "sedentary", label: "Sedentary" },
          { value: "lightly_active", label: "Lightly active" },
          { value: "moderately_active", label: "Moderately active" },
          { value: "very_active", label: "Very active" },
        ]}
        value={form.daily_step_count}
        onChange={(v) => update("daily_step_count", v)}
      />
      <SliderField
        label="Sleep per night (hours)"
        min={4}
        max={11}
        step={0.5}
        value={form.sleep_hours}
        onChange={(v) => update("sleep_hours", v)}
      />
      <SliderField
        label="Stress level"
        min={1}
        max={10}
        value={form.stress_level}
        onChange={(v) => update("stress_level", v)}
      />
    </>
  );
}

export function HistorySection({ form, update }: SectionProps) {
  return (
    <>
      <h2>History & health</h2>
      <TextField
        label="Previous weight gain attempts"
        hint="what happened?"
        multiline
        value={form.previous_weight_gain_attempts}
        onChange={(v) => update("previous_weight_gain_attempts", v)}
      />
      <TextField
        label="Medications"
        hint="comma-separated, optional"
        value={form.medications}
        onChange={(v) => update("medications", v)}
      />
      <TextField
        label="Medical conditions"
        hint="comma-separated, optional"
        value={form.conditions}
        onChange={(v) => update("conditions", v)}
      />
      <TextField
        label="Current or past injuries"
        hint="comma-separated, optional"
        value={form.injuries}
        onChange={(v) => update("injuries", v)}
      />
    </>
  );
}
