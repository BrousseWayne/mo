import { useState } from "react";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import { useMutation } from "../hooks/use-mutation";
import type { MealPlanData, MealSlot, RecipeGenerateResult, StoredRecipe } from "../api/types";

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

function RecipeCard({ recipe }: { recipe: StoredRecipe }) {
  const [open, setOpen] = useState(false);
  const m = recipe.macros_per_serving;
  return (
    <div className="card">
      <div className="slot-head">
        <span className="slot-name">{recipe.recipe_name}</span>
        <span className="badge low">{recipe.cuisine}</span>
      </div>
      <div className="muted">
        {m.protein_g}g protein · {m.calories} kcal/serving · {recipe.time_prep + recipe.time_cook} min
        {recipe.verified ? " · macros verified" : ""}
      </div>
      <button type="button" className="btn ghost" style={{ width: "auto", minHeight: 32, padding: 0 }} onClick={() => setOpen((s) => !s)}>
        {open ? "Hide recipe" : "Show recipe"}
      </button>
      {open ? (
        <>
          <h2 style={{ marginTop: 8 }}>Ingredients</h2>
          <ul className="bullets">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.amount_g} g {ing.item}
                {ing.prep_notes ? ` — ${ing.prep_notes}` : ""}
              </li>
            ))}
          </ul>
          <h2 style={{ marginTop: 8 }}>Steps</h2>
          <ol className="bullets">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {recipe.batch_notes ? <p className="muted" style={{ marginTop: 6 }}>{recipe.batch_notes}</p> : null}
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
  const { data: recipes, refetch: refetchRecipes } = useQuery<StoredRecipe[]>("/recipes?limit=20");
  const { mutate, loading: generating, error: generateError } = useMutation<RecipeGenerateResult>();
  const [generated, setGenerated] = useState<RecipeGenerateResult | null>(null);

  const generate = async () => {
    if (!programId) return;
    setGenerated(null);
    const res = await mutate(`/programs/${programId}/recipes/generate`, "POST", { count: 2 });
    setGenerated(res);
    refetchRecipes();
  };

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

      <h1 style={{ marginTop: 24 }}>Recipes</h1>
      <p className="page-sub">
        Chef-generated variations on your lunch and dinner slots, macro-checked against the ingredient table.
      </p>
      {generateError ? <div className="error-box">{generateError}</div> : null}
      {generated ? (
        <div className="success-box">
          {generated.recipes_created} recipe{generated.recipes_created === 1 ? "" : "s"} added
          {generated.rejected.length > 0 ? ` · ${generated.rejected.length} rejected by the macro check` : ""}.
        </div>
      ) : null}
      <button type="button" className="btn secondary" disabled={generating} onClick={generate} style={{ marginBottom: 10 }}>
        {generating ? "Cooking up ideas… (1-2 minutes)" : "Generate 2 new recipes"}
      </button>
      {recipes?.length
        ? recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)
        : <div className="card muted">No recipes yet — generate some for variety.</div>}
    </>
  );
}
