import { useState } from "react";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import type { MealPlanData, MealSlot } from "../api/types";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SLOT_ORDER = ["breakfast", "lunch", "snack", "dinner", "presleep"];
const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
  presleep: "Pre-sleep",
};

function todayKey(): string {
  return DAYS[(new Date().getDay() + 6) % 7];
}

function SlotCard({ slotKey, slot }: { slotKey: string; slot: MealSlot }) {
  const [showAlts, setShowAlts] = useState(false);
  return (
    <div className="card">
      <div className="slot-head">
        <span className="slot-name">{SLOT_LABELS[slotKey] ?? slotKey}</span>
        <span className={`badge ${slot.compliance_risk}`}>
          {slot.compliance_risk === "high"
            ? "don't skip"
            : slot.compliance_risk === "medium"
              ? "watch this one"
              : "on rails"}
        </span>
      </div>
      <div className="muted">
        ~{slot.slot_spec.protein_g}g protein · ~{slot.slot_spec.calories} kcal
        {slot.primary_protein ? ` · ${slot.primary_protein}` : ""}
        {slot.cuisine_preference ? ` · ${slot.cuisine_preference}` : ""}
      </div>
      <div style={{ marginTop: 8, fontWeight: 600 }}>{slot.primary_option ?? "Free choice"}</div>
      {slot.alternatives.length > 0 ? (
        <>
          <button type="button" className="btn ghost" style={{ width: "auto", minHeight: 32, padding: 0 }} onClick={() => setShowAlts((s) => !s)}>
            {showAlts ? "Hide alternatives" : `Alternatives (${slot.alternatives.length})`}
          </button>
          {showAlts ? (
            <div className="alt-list">
              <ul className="plain">
                {slot.alternatives.map((alt, i) => (
                  <li key={i}>{alt.option ?? "Free choice"}</li>
                ))}
              </ul>
              <div className="muted" style={{ marginTop: 6 }}>{slot.compliance_note}</div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function MealPlanPage() {
  const { programId } = useProgramId();
  const [day, setDay] = useState(todayKey());
  const { data, loading, error } = useQuery<MealPlanData>(
    programId ? `/programs/${programId}/meal-plan` : null
  );

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="error-box">{error}</div>;

  const template = data?.template?.weekly_template;
  if (!template) {
    return (
      <>
        <h1>Meal plan</h1>
        <div className="card">
          <p className="muted">No meal plan yet — finish the intake to generate your program.</p>
        </div>
      </>
    );
  }

  const daySlots = template[day];

  return (
    <>
      <h1>Meal plan</h1>
      <p className="page-sub">5 meals a day, built for your targets. Eating them all is the program.</p>
      <div className="day-tabs">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            className={`day-tab${d === day ? " active" : ""}`}
            onClick={() => setDay(d)}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>
      {daySlots
        ? SLOT_ORDER.filter((s) => daySlots[s]).map((s) => (
            <SlotCard key={s} slotKey={s} slot={daySlots[s]} />
          ))
        : <div className="card muted">No template for this day.</div>}
    </>
  );
}
