import { useState } from "react";
import { Link } from "react-router";
import { useProgramId } from "../context/ProgramContext";
import { useMutation } from "../hooks/use-mutation";
import { ChoiceField, NumberField, SliderField, TextField } from "../components/fields";
import type { CheckinResult } from "../api/types";

const TRIGGER_LABELS: Record<string, string> = {
  insufficient_gain: "Gain below target — calorie targets will be adjusted up",
  excessive_gain: "Gain above target — calorie targets will be adjusted down",
  weight_milestone: "Weight milestone reached — targets recalculated",
  protein_recalc: "Protein target recalculated for your new weight",
  waist_hip_flag: "Waist/hip change flagged for review",
  training_stall: "Training progression stall detected",
  compliance_low: "Low compliance detected — plan will be simplified",
  tier_progression: "Calorie tier progression",
  phase_transition: "Training phase transition",
};

export function CheckinPage() {
  const { programId } = useProgramId();
  const { mutate, loading } = useMutation<CheckinResult>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [cyclePhase, setCyclePhase] = useState<string | undefined>();
  const [cycleDay, setCycleDay] = useState("");
  const [energy, setEnergy] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [mood, setMood] = useState(5);
  const [appetite, setAppetite] = useState(5);
  const [mvdCount, setMvdCount] = useState(0);
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!programId) return;
    const weightNum = Number(weight);
    if (!weight || weightNum <= 0) {
      setError("Weight is required.");
      return;
    }
    setError(null);
    try {
      const res = await mutate(`/programs/${programId}/checkins`, "POST", {
        weight_kg: weightNum,
        ...(waist ? { waist_cm: Number(waist) } : {}),
        ...(hip ? { hip_cm: Number(hip) } : {}),
        ...(cyclePhase ? { cycle_phase: cyclePhase } : {}),
        ...(cycleDay ? { cycle_day: Number(cycleDay) } : {}),
        subjective_markers: {
          energy,
          sleep_quality: sleepQuality,
          mood,
          appetite,
        },
        minimum_viable_days_count: mvdCount,
        ...(notes ? { notes } : {}),
      });
      setResult(res);
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed.");
    }
  };

  if (result) {
    return (
      <>
        <h1>Check-in saved</h1>
        <p className="page-sub">Week {result.week_number} recorded.</p>
        <div className="success-box">
          Your check-in is in. Consistency like this is what builds mass.
        </div>
        {result.triggers_fired.length > 0 ? (
          <div className="card">
            <h2>What your numbers triggered</h2>
            <ul className="bullets">
              {result.triggers_fired.map((t) => (
                <li key={t}>{TRIGGER_LABELS[t] ?? t.replace(/_/g, " ")}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card">
            <h2>No adjustments needed</h2>
            <p className="muted">Everything is tracking as planned — keep going.</p>
          </div>
        )}
        <Link to="/" className="btn" style={{ textDecoration: "none" }}>
          Back to dashboard
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Weekly check-in</h1>
      <p className="page-sub">Same day, same conditions each week gives the cleanest signal.</p>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="card">
        <h2>Measurements</h2>
        <NumberField label="Weight" hint="kg, required" value={weight} onChange={setWeight} />
        <NumberField label="Waist" hint="cm, optional" value={waist} onChange={setWaist} />
        <NumberField label="Hip" hint="cm, optional" value={hip} onChange={setHip} />
      </div>

      <div className="card">
        <h2>Cycle</h2>
        <ChoiceField
          label="Current phase"
          hint="if you track it"
          options={[
            { value: "follicular", label: "Follicular" },
            { value: "luteal", label: "Luteal" },
            { value: "menstrual", label: "Menstrual" },
          ]}
          value={cyclePhase}
          onChange={setCyclePhase}
        />
        <NumberField label="Cycle day" hint="optional" value={cycleDay} onChange={setCycleDay} />
      </div>

      <div className="card">
        <h2>How the week felt</h2>
        <SliderField label="Energy" min={1} max={10} value={energy} onChange={setEnergy} />
        <SliderField label="Sleep quality" min={1} max={10} value={sleepQuality} onChange={setSleepQuality} />
        <SliderField label="Mood" min={1} max={10} value={mood} onChange={setMood} />
        <SliderField label="Appetite" min={1} max={10} value={appetite} onChange={setAppetite} />
      </div>

      <div className="card">
        <h2>Eating consistency</h2>
        <SliderField
          label="Days you hit all 5 meals"
          min={0}
          max={7}
          value={mvdCount}
          onChange={setMvdCount}
        />
        <TextField
          label="Notes"
          hint="optional"
          multiline
          value={notes}
          onChange={setNotes}
          placeholder="Anything worth remembering about this week"
        />
      </div>

      <button type="button" className="btn" disabled={loading} onClick={submit}>
        {loading ? "Saving…" : "Save check-in"}
      </button>
    </>
  );
}
