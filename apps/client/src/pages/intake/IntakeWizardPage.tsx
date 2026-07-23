import { useState } from "react";
import { useNavigate } from "react-router";
import { StepIndicator } from "../../components/fields";
import { useMutation } from "../../hooks/use-mutation";
import { useProgramId } from "../../context/ProgramContext";
import {
  INITIAL_FORM,
  type IntakeForm,
  BasicsSection,
  TrainingSection,
  NutritionSection,
  CycleSection,
  LifestyleSection,
  HistorySection,
} from "./sections";

const SECTIONS = [
  BasicsSection,
  TrainingSection,
  NutritionSection,
  CycleSection,
  LifestyleSection,
  HistorySection,
];

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateStep(step: number, form: IntakeForm): string | null {
  if (step === 0) {
    const age = Number(form.age);
    const height = Number(form.height_cm);
    const current = Number(form.current_weight_kg);
    const target = Number(form.target_weight_kg);
    if (!form.age || age < 18 || age > 65) return "Age must be between 18 and 65.";
    if (!form.height_cm || height < 100 || height > 220) return "Height must be between 100 and 220 cm.";
    if (!form.current_weight_kg || current < 30 || current > 200) return "Current weight must be between 30 and 200 kg.";
    if (!form.target_weight_kg || target < 30 || target > 200) return "Target weight must be between 30 and 200 kg.";
    if (target <= current) return "Target weight should be above current weight — this program is about gaining.";
  }
  if (step === 1 && !form.training_status) {
    return "Select your training experience.";
  }
  return null;
}

function buildPayload(form: IntakeForm) {
  return {
    age: Number(form.age),
    height_cm: Number(form.height_cm),
    current_weight_kg: Number(form.current_weight_kg),
    target_weight_kg: Number(form.target_weight_kg),
    training_status: form.training_status,
    training_frequency_per_week: form.training_frequency_per_week,
    ...(form.estimated_daily_calories
      ? { estimated_daily_calories: Number(form.estimated_daily_calories) }
      : {}),
    ...(form.daily_step_count ? { daily_step_count: form.daily_step_count } : {}),
    ...(form.menstrual_cycle_length ? { menstrual_cycle_length: form.menstrual_cycle_length } : {}),
    cycle_tracking: form.cycle_tracking,
    sleep_hours: form.sleep_hours,
    stress_level: form.stress_level,
    ...(form.previous_weight_gain_attempts
      ? { previous_weight_gain_attempts: form.previous_weight_gain_attempts }
      : {}),
    food_aversions: ["peanut_butter", "nut_butters", ...splitList(form.extra_aversions)],
    ...(form.appetite_level ? { appetite_level: form.appetite_level } : {}),
    ...(form.cooking_skill ? { cooking_skill: form.cooking_skill } : {}),
    partner_cooks: form.partner_cooks,
    ...(form.equipment_access ? { equipment_access: form.equipment_access } : {}),
    ...(form.gym_anxiety_level ? { gym_anxiety_level: form.gym_anxiety_level } : {}),
    ...(form.medications || form.conditions || form.injuries
      ? {
          medical_history: {
            medications: splitList(form.medications),
            conditions: splitList(form.conditions),
            injuries: splitList(form.injuries),
          },
        }
      : {}),
  };
}

export function IntakeWizardPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeForm>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const { mutate, loading } = useMutation<Record<string, string>>();
  const { setProgramId } = useProgramId();
  const navigate = useNavigate();

  const update = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const Section = SECTIONS[step];
  const isLast = step === SECTIONS.length - 1;

  const next = async () => {
    const problem = validateStep(step, form);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (!isLast) {
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
      return;
    }
    try {
      const intake = await mutate("/intake", "POST", buildPayload(form));
      const program = await mutate("/programs/from-artifacts", "POST", {
        user_id: intake.user_id,
        intake_response_id: intake.intake_response_id,
      });
      setProgramId(program.program_id);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <div className="app-shell">
      <main className="app-content" style={{ paddingBottom: 24 }}>
        <h1>Let's set up your program</h1>
        <p className="page-sub">
          Step {step + 1} of {SECTIONS.length}
        </p>
        <StepIndicator step={step} total={SECTIONS.length} />
        {error ? <div className="error-box">{error}</div> : null}
        <div className="card">
          <Section form={form} update={update} />
        </div>
        <div className="btn-row">
          {step > 0 ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setError(null);
                setStep((s) => s - 1);
              }}
            >
              Back
            </button>
          ) : null}
          <button type="button" className="btn" disabled={loading} onClick={next}>
            {loading ? "Creating your program…" : isLast ? "Create my program" : "Next"}
          </button>
        </div>
      </main>
    </div>
  );
}
