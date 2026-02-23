import { useState } from "react";

type Tab = "loop" | "agents" | "triggers" | "states" | "features" | "data" | "api";

const TABS: { id: Tab; label: string }[] = [
  { id: "loop", label: "Core Loop" },
  { id: "agents", label: "Agent Pipeline" },
  { id: "triggers", label: "Trigger Engine" },
  { id: "states", label: "State Machines" },
  { id: "features", label: "Feature Map" },
  { id: "data", label: "Data Architecture" },
  { id: "api", label: "API Surface" },
];

export function SystemMapPage() {
  const [tab, setTab] = useState<Tab>("loop");

  return (
    <div>
      <h1 className="page-title">System Map</h1>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", background: tab === t.id ? "var(--c-accent)" : "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: "var(--radius)", color: tab === t.id ? "#fff" : "var(--c-text)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "loop" && <CoreLoopTab />}
      {tab === "agents" && <AgentPipelineTab />}
      {tab === "triggers" && <TriggerEngineTab />}
      {tab === "states" && <StateMachinesTab />}
      {tab === "features" && <FeatureMapTab />}
      {tab === "data" && <DataArchitectureTab />}
      {tab === "api" && <APISurfaceTab />}
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: subtitle ? 2 : 16 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--c-text-dim)", marginBottom: 16 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", background: `${color}22`, color, borderRadius: 3, fontSize: 11, fontWeight: 600, marginRight: 4, marginBottom: 4 }}>{children}</span>;
}

function CoreLoopTab() {
  return (
    <div>
      <SectionCard title="The Adaptive Coaching Loop" subtitle="MO is not a one-shot plan generator. It's a continuous observe → plan → execute → measure → adapt cycle.">
        <svg viewBox="0 0 1100 320" style={{ width: "100%", height: 320 }}>
          <defs>
            <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth={7} markerHeight={7} orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-text-dim)" /></marker>
            <marker id="ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth={7} markerHeight={7} orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-success)" /></marker>
          </defs>
          {[
            { label: "INTAKE", sub: "69 questions → IntakeData", x: 90, y: 60, color: "var(--c-accent)", w: 160 },
            { label: "PIPELINE RUN", sub: "5 agents sequential\n40-70s execution", x: 310, y: 60, color: "var(--c-warning)", w: 160 },
            { label: "PLAN OUTPUT", sub: "Macros + meals + training\n+ recipes + supplements", x: 530, y: 60, color: "var(--c-success)", w: 180 },
            { label: "USER EXECUTES", sub: "Eats meals, trains, lives\n1 week passes", x: 770, y: 60, color: "#9B5DE5", w: 170 },
            { label: "WEEKLY CHECK-IN", sub: "Weight + measurements\n+ training log + subjective", x: 1000, y: 60, color: "var(--c-accent)", w: 180 },
          ].map((s, i, arr) => (
            <g key={s.label}>
              <rect x={s.x - s.w / 2} y={s.y - 20} width={s.w} height={56} rx={8} fill={`${s.color}15`} stroke={s.color} strokeWidth={2} />
              <text x={s.x} y={s.y + 2} textAnchor="middle" fill={s.color} fontSize={12} fontWeight={700}>{s.label}</text>
              {s.sub.split("\n").map((line, li) => (
                <text key={li} x={s.x} y={s.y + 16 + li * 13} textAnchor="middle" fill="var(--c-text-dim)" fontSize={10}>{line}</text>
              ))}
              {i < arr.length - 1 && <line x1={s.x + s.w / 2 + 4} y1={s.y + 8} x2={arr[i + 1].x - arr[i + 1].w / 2 - 4} y2={arr[i + 1].y + 8} stroke="var(--c-text-dim)" strokeWidth={1.5} markerEnd="url(#a)" />}
            </g>
          ))}

          <rect x={380} y={160} width={340} height={56} rx={8} fill="rgba(251,191,36,0.1)" stroke="var(--c-warning)" strokeWidth={2} />
          <text x={550} y={182} textAnchor="middle" fill="var(--c-warning)" fontSize={12} fontWeight={700}>TRIGGER EVALUATION ENGINE</text>
          <text x={550} y={197} textAnchor="middle" fill="var(--c-text-dim)" fontSize={10}>9 rules evaluated in priority order</text>

          <line x1={1000} y1={96} x2={1000} y2={140} stroke="var(--c-text-dim)" strokeWidth={1.5} />
          <line x1={1000} y1={140} x2={720} y2={140} stroke="var(--c-text-dim)" strokeWidth={1.5} />
          <line x1={720} y1={140} x2={720} y2={162} stroke="var(--c-text-dim)" strokeWidth={1.5} markerEnd="url(#a)" />

          <path d="M 380 188 C 280 188, 280 68, 310 68" fill="none" stroke="var(--c-success)" strokeWidth={2} strokeDasharray="6 3" markerEnd="url(#ag)" />
          <text x={240} y={145} fill="var(--c-success)" fontSize={10} fontWeight={600}>PARTIAL</text>
          <text x={240} y={157} fill="var(--c-success)" fontSize={10} fontWeight={600}>RE-EXECUTION</text>

          <rect x={380} y={240} width={340} height={48} rx={8} fill="rgba(233,57,70,0.1)" stroke="#E63946" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={550} y={260} textAnchor="middle" fill="#E63946" fontSize={11} fontWeight={700}>PHYSICIAN — on-demand interrupt</text>
          <text x={550} y={274} textAnchor="middle" fill="var(--c-text-dim)" fontSize={9}>Any agent can call. Can pause/abort pipeline.</text>
        </svg>
      </SectionCard>

      <SectionCard title="Data Flow Through the Loop">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-accent)", marginBottom: 8 }}>INPUTS (collected)</div>
            {["Weight (weekly)", "Waist/hip measurements", "Cycle phase + day", "Training log (sets/reps/weight/RPE)", "Subjective markers (energy, sleep, stress, appetite, mood)", "Minimum viable days count", "Notes / free text"].map((s) => <div key={s} style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--c-border)" }}>{s}</div>)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-warning)", marginBottom: 8 }}>EVALUATED (trigger engine)</div>
            {["Weight gain rate vs 0.25-0.5 kg/week target", "Waist-hip ratio trend over 4 weeks", "Training progression (stall detection)", "Compliance (MVD count)", "Milestone detection (every 5 kg)", "Protein recalc timing (30-day)", "Tier/phase transition readiness"].map((s) => <div key={s} style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--c-border)" }}>{s}</div>)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-success)", marginBottom: 8 }}>OUTPUTS (delivered)</div>
            {["Updated macro targets", "Revised meal templates + recipes", "Adjusted training program", "Supplement protocol changes", "Milestone notifications", "Adjustment explanations", "Red flag alerts (if any)"].map((s) => <div key={s} style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--c-border)" }}>{s}</div>)}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

const AGENTS_DETAIL = [
  {
    id: "SCIENTIST", color: "#457B9D", model: "Sonnet 4.5", position: "1st",
    role: "Calculation engine — all numbers, no opinions",
    consumes: ["IntakeData (69 fields)", "Previous SCIENTIST output (on re-run)"],
    produces: ["BMR (Mifflin-St Jeor)", "TDEE with activity factor", "Target intake (TDEE + surplus)", "Macro split (protein/fat/carbs)", "3-week calorie ramp-up schedule", "Weight projection timeline", "Training phase assignment", "Red flags if detected"],
    tools: [
      { name: "calculate_bmr", desc: "Mifflin-St Jeor: 10×kg + 6.25×cm - 5×age - 161" },
      { name: "calculate_tdee", desc: "BMR × activity factor (1.2-1.9)" },
      { name: "calculate_macros", desc: "Protein 1.6-2.0 g/kg, fat ≥25%, carbs remainder" },
      { name: "calculate_ramp_up", desc: "3-week progressive surplus (33% → 66% → 100%)" },
      { name: "calculate_weight_projection", desc: "Weeks to target at 0.25-0.5 kg/week" },
    ],
    writes: ["programs (target_intake_kcal, macros, surplus)"],
    overrides: "Numeric matters — all other agents defer on calculations",
  },
  {
    id: "NUTRITIONIST", color: "#2A9D8F", model: "Sonnet 4.5", position: "2nd",
    role: "Strategy layer — how to distribute and optimize the numbers",
    consumes: ["SCIENTIST macro targets", "IntakeData (appetite, aversions, cycle)"],
    produces: ["Protein distribution across 5 meals (MPS optimization)", "Hardgainer tactics (calorie-dense strategies)", "Supplement protocol (creatine, D3, iron, B12, omega-3)", "Cycle-phase adjustments", "Calcium-iron separation plan", "Calorie tier assignment"],
    tools: [
      { name: "protein_distribution", desc: "Optimize MPS: 0.4g/kg per meal, leucine threshold" },
      { name: "hardgainer_tactics", desc: "Calorie-dense foods, liquid calories, flavor variety" },
      { name: "supplement_protocol", desc: "Evidence-based supplements with timing" },
      { name: "cycle_adjustments", desc: "Luteal phase: +100-200 kcal, more magnesium" },
    ],
    writes: [],
    overrides: "Nutrition strategy — overrides DIETITIAN and CHEF on macro compliance",
  },
  {
    id: "DIETITIAN", color: "#F4A261", model: "Sonnet 4.5", position: "3rd",
    role: "Architecture layer — the weekly meal blueprint",
    consumes: ["NUTRITIONIST strategy + protein distribution", "IntakeData (cooking skill, partner, schedule)"],
    produces: ["7-day meal template (breakfast/lunch/snack/dinner/presleep)", "Rotation schedule (cuisine variety)", "Batch cooking schedule", "Emergency protocol (low-effort fallback day)", "Solo week protocol (when cook unavailable)", "Compliance tracking protocol"],
    tools: [
      { name: "weekly_template", desc: "7-day plan with macro targets per slot" },
      { name: "rotation_schedule", desc: "Cycle through 9 cuisine profiles" },
      { name: "batch_schedule", desc: "Which items to batch-cook and when" },
      { name: "emergency_protocol", desc: "Minimum-effort meal plan for bad days" },
    ],
    writes: [],
    overrides: "Overrides CHEF on macro compliance per slot",
  },
  {
    id: "CHEF", color: "#E9C46A", model: "Sonnet 4.5", position: "4th",
    role: "Execution layer — real recipes with real ingredients",
    consumes: ["DIETITIAN meal template + slot specs", "IntakeData (aversions, cooking skill)"],
    produces: ["Concrete recipes with ingredients (grams)", "Macros per serving (cross-checked vs USDA)", "Cooking instructions", "Batch cooking protocols", "Calorie-dense shakes", "Storage instructions (fridge/freezer)"],
    tools: [
      { name: "recipe_generation", desc: "Recipes matching slot macro targets ±10%" },
      { name: "batch_cooking", desc: "Parallel cooking timeline, prep order" },
      { name: "shake_recipes", desc: "High-calorie liquid meals for low appetite" },
    ],
    writes: ["recipes (name, cuisine, ingredients, macros, instructions)"],
    overrides: "Autonomous on flavor/technique, defers to DIETITIAN on macros",
  },
  {
    id: "COACH", color: "#9B5DE5", model: "Sonnet 4.5", position: "5th",
    role: "Training programming — progressive overload for muscle gain",
    consumes: ["SCIENTIST (phase, weight, timeline)", "IntakeData (training status, equipment, anxiety)"],
    produces: ["Weekly training sessions (3-4/week)", "Exercise selection with sets/reps/rest/RPE", "Progression rules per exercise", "Recovery protocols", "Phase transition criteria", "Deload week programming"],
    tools: [
      { name: "training_program", desc: "Phase-appropriate program (0: learn, 1: build, 2: push)" },
      { name: "progression_rules", desc: "When to add weight/reps, double progression" },
      { name: "recovery_protocol", desc: "Sleep, rest days, deload triggers" },
      { name: "phase_transitions", desc: "Criteria to advance phase" },
    ],
    writes: ["training_sessions (exercises, focus, warmup)"],
    overrides: "Autonomous on training, defers to SCIENTIST on recovery metrics",
  },
  {
    id: "PHYSICIAN", color: "#E63946", model: "Haiku 4.5", position: "On-demand",
    role: "Health advisory — medical guardrails and referrals",
    consumes: ["Any agent's query", "Knowledge base (medical-reference.md)"],
    produces: ["Health assessment with scientific sources", "Referral recommendation (if needed)", "Urgency level (routine/soon/urgent)", "Pipeline action (continue/pause/abort)"],
    tools: [
      { name: "health_assessment", desc: "Evaluate concern against medical knowledge" },
      { name: "referral_logic", desc: "When to refer to GP, dietitian, psychologist" },
      { name: "red_flag_detection", desc: "Amenorrhea, ED history, RED-S, persistent pain" },
    ],
    writes: ["physician_queries, red_flags"],
    overrides: "Health guardrails override ALL other agents",
  },
];

function AgentPipelineTab() {
  const [selected, setSelected] = useState<string | null>(null);
  const agent = AGENTS_DETAIL.find((a) => a.id === selected);

  return (
    <div>
      <SectionCard title="Sequential Agent Pipeline" subtitle="Each agent receives all upstream outputs via AgentContext.previousOutputs. Pipeline runs via BullMQ worker (concurrency: 1).">
        <svg viewBox="0 0 1200 200" style={{ width: "100%", height: 200 }}>
          <defs><marker id="ap" viewBox="0 0 10 10" refX="9" refY="5" markerWidth={8} markerHeight={8} orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-text-dim)" /></marker></defs>
          {AGENTS_DETAIL.filter((a) => a.id !== "PHYSICIAN").map((a, i, arr) => {
            const x = 120 + i * 210;
            const w = 170;
            return (
              <g key={a.id} onClick={() => setSelected(selected === a.id ? null : a.id)} style={{ cursor: "pointer" }}>
                <rect x={x - w / 2} y={20} width={w} height={80} rx={8} fill={selected === a.id ? `${a.color}30` : `${a.color}12`} stroke={a.color} strokeWidth={selected === a.id ? 3 : 2} />
                <text x={x} y={44} textAnchor="middle" fill={a.color} fontSize={13} fontWeight={800}>{a.id}</text>
                <text x={x} y={60} textAnchor="middle" fill="var(--c-text-dim)" fontSize={9}>{a.position} · {a.model}</text>
                <text x={x} y={76} textAnchor="middle" fill="var(--c-text-dim)" fontSize={9}>{a.tools.length} tools</text>
                {i < arr.length - 1 && <line x1={x + w / 2 + 4} y1={60} x2={x + 210 - w / 2 - 4} y2={60} stroke="var(--c-text-dim)" strokeWidth={2} markerEnd="url(#ap)" />}
              </g>
            );
          })}
          <g onClick={() => setSelected(selected === "PHYSICIAN" ? null : "PHYSICIAN")} style={{ cursor: "pointer" }}>
            <rect x={445} y={130} width={170} height={55} rx={8} fill={selected === "PHYSICIAN" ? "#E6394630" : "#E6394612"} stroke="#E63946" strokeWidth={selected === "PHYSICIAN" ? 3 : 2} strokeDasharray={selected === "PHYSICIAN" ? "none" : "6 3"} />
            <text x={530} y={154} textAnchor="middle" fill="#E63946" fontSize={13} fontWeight={800}>PHYSICIAN</text>
            <text x={530} y={170} textAnchor="middle" fill="var(--c-text-dim)" fontSize={9}>on-demand · Haiku 4.5</text>
          </g>
          {AGENTS_DETAIL.filter((a) => a.id !== "PHYSICIAN").map((_, i) => {
            const x = 120 + i * 210;
            return <line key={i} x1={x} y1={100} x2={530} y2={130} stroke="#E6394620" strokeWidth={1} strokeDasharray="3 3" />;
          })}
        </svg>
      </SectionCard>

      {agent && (
        <SectionCard title={agent.id} subtitle={agent.role}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <Label>Consumes</Label>
              {agent.consumes.map((c) => <Item key={c}>{c}</Item>)}
            </div>
            <div>
              <Label>Produces</Label>
              {agent.produces.map((p) => <Item key={p}>{p}</Item>)}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Label>Tools ({agent.tools.length})</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {agent.tools.map((t) => (
                <div key={t.name} style={{ background: "var(--c-surface-2)", borderRadius: "var(--radius)", padding: "8px 12px", borderLeft: `3px solid ${agent.color}` }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: agent.color }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--c-text-dim)", marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><Label>Writes to DB</Label><div style={{ fontSize: 12 }}>{agent.writes.length ? agent.writes.join(", ") : "Nothing — pure advisory"}</div></div>
            <div><Label>Override Authority</Label><div style={{ fontSize: 12 }}>{agent.overrides}</div></div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Conflict Resolution Hierarchy">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { rank: 1, rule: "Health guardrails override ALL", color: "#E63946", agent: "PHYSICIAN" },
            { rank: 2, rule: "Numeric calculations are authoritative", color: "#457B9D", agent: "SCIENTIST" },
            { rank: 3, rule: "Nutrition strategy overrides meal/recipe decisions", color: "#2A9D8F", agent: "NUTRITIONIST" },
            { rank: 4, rule: "Meal template overrides recipe macros", color: "#F4A261", agent: "DIETITIAN" },
            { rank: 5, rule: "Training is autonomous, defers on recovery metrics", color: "#9B5DE5", agent: "COACH" },
          ].map((h) => (
            <div key={h.rank} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--c-surface-2)", borderRadius: "var(--radius)", borderLeft: `4px solid ${h.color}` }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: h.color, minWidth: 30 }}>{h.rank}</span>
              <Badge color={h.color}>{h.agent}</Badge>
              <span style={{ fontSize: 13 }}>{h.rule}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

const TRIGGERS = [
  { id: "waist_hip_flag", label: "Waist-Hip Flag", priority: 1, condition: "Waist-hip ratio increasing >0.02 over 4+ weeks", action: "Review composition, possible -100 kcal", rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF", "COACH"], skip: [], postAdaptation: true, threshold: "waist_hip_weeks: 4" },
  { id: "insufficient_gain", label: "Insufficient Gain", priority: 2, condition: "Average weekly gain <0.25 kg for 2 consecutive weeks", action: "+200 kcal surplus increase", rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"], postAdaptation: true, threshold: "min_weekly_gain: 0.25, calorie_increase: 200" },
  { id: "excessive_gain", label: "Excessive Gain", priority: 3, condition: "Average weekly gain >0.75 kg", action: "-150 kcal surplus decrease", rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"], postAdaptation: true, threshold: "max_weekly_gain: 0.75, calorie_decrease: 150" },
  { id: "weight_milestone", label: "Weight Milestone", priority: 4, condition: "Every +5 kg gained from start weight", action: "Full TDEE and macro recalculation at new weight", rerun: ["SCIENTIST", "NUTRITIONIST"], skip: ["DIETITIAN", "CHEF", "COACH"], postAdaptation: false, threshold: "milestone_interval_kg: 5" },
  { id: "protein_recalc", label: "Protein Recalc", priority: 5, condition: "30 days since last protein recalculation", action: "Protein target update at current weight", rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"], postAdaptation: false, threshold: "protein_recalc_days: 30" },
  { id: "training_stall", label: "Training Stall", priority: 6, condition: "2+ exercises stalled over 3+ sessions (no progression)", action: "COACH program modification or deload", rerun: ["COACH"], skip: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], postAdaptation: true, threshold: "stall_sessions: 3, stall_lifts: 2" },
  { id: "compliance", label: "Compliance Issue", priority: 7, condition: "Average minimum viable days <2 per week", action: "Simplify DIETITIAN template", rerun: ["DIETITIAN", "CHEF"], skip: ["SCIENTIST", "NUTRITIONIST", "COACH"], postAdaptation: false, threshold: "compliance_mvd_threshold: 2" },
  { id: "tier_progression", label: "Tier Progression", priority: 8, condition: "80%+ meal compliance for 3 consecutive weeks", action: "Advance calorie tier (more complex meals)", rerun: ["SCIENTIST", "NUTRITIONIST", "DIETITIAN", "CHEF"], skip: ["COACH"], postAdaptation: false, threshold: "3 weeks at 80%+" },
  { id: "phase_transition", label: "Phase Transition", priority: 9, condition: "60%+ exercises progressing over 4 weeks", action: "Advance training phase", rerun: ["SCIENTIST", "COACH"], skip: ["NUTRITIONIST", "DIETITIAN", "CHEF"], postAdaptation: false, threshold: "4 weeks, 60% progression" },
];

const AC: Record<string, string> = { SCIENTIST: "#457B9D", NUTRITIONIST: "#2A9D8F", DIETITIAN: "#F4A261", CHEF: "#E9C46A", COACH: "#9B5DE5", PHYSICIAN: "#E63946" };

function TriggerEngineTab() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div>
      <SectionCard title="Trigger Evaluation Engine" subtitle="After each weekly check-in, evaluateAllTriggers() runs all 9 rules in priority order. First 4 weeks are adaptation period — weight-based triggers suppressed.">
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "var(--c-surface-2)", borderRadius: "var(--radius)", padding: "8px 12px", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text-dim)", textTransform: "uppercase" }}>Adaptation Period</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>4 weeks</div>
            <div style={{ fontSize: 11, color: "var(--c-text-dim)" }}>Weight-based triggers blocked during ramp-up</div>
          </div>
          <div style={{ background: "var(--c-surface-2)", borderRadius: "var(--radius)", padding: "8px 12px", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text-dim)", textTransform: "uppercase" }}>Target Gain Rate</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>0.25 – 0.50 kg/week</div>
            <div style={{ fontSize: 11, color: "var(--c-text-dim)" }}>Below → +200 kcal, Above → -150 kcal</div>
          </div>
          <div style={{ background: "var(--c-surface-2)", borderRadius: "var(--radius)", padding: "8px 12px", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text-dim)", textTransform: "uppercase" }}>Calorie Tiers</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>tier_0 → tier_1 → tier_2</div>
            <div style={{ fontSize: 11, color: "var(--c-text-dim)" }}>Meal complexity increases with compliance</div>
          </div>
        </div>
      </SectionCard>

      {TRIGGERS.map((t) => {
        const isOpen = selected === t.id;
        return (
          <div key={t.id} className="card" style={{ padding: 0, marginBottom: 8, cursor: "pointer", borderLeft: `4px solid ${isOpen ? "var(--c-accent)" : "var(--c-border)"}` }} onClick={() => setSelected(isOpen ? null : t.id)}>
            <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--c-text-dim)", minWidth: 30 }}>P{t.priority}</span>
              <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{t.label}</span>
              <span style={{ fontSize: 11, color: "var(--c-text-dim)", padding: "2px 8px", background: "var(--c-surface-2)", borderRadius: 3 }}>{t.postAdaptation ? "post-adaptation" : "any time"}</span>
              <span style={{ fontSize: 11, color: "var(--c-text-dim)" }}>{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--c-border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                  <div>
                    <Label>Condition</Label>
                    <div style={{ fontSize: 13 }}>{t.condition}</div>
                  </div>
                  <div>
                    <Label>Action</Label>
                    <div style={{ fontSize: 13 }}>{t.action}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Label>Thresholds</Label>
                  <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--c-warning)" }}>{t.threshold}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                  <div>
                    <Label>Re-run agents</Label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{t.rerun.map((a) => <Badge key={a} color={AC[a]}>{a}</Badge>)}</div>
                  </div>
                  <div>
                    <Label>Skip (use cached output)</Label>
                    {t.skip.length === 0 ? <div style={{ fontSize: 12, color: "var(--c-text-dim)" }}>All agents re-run</div> : <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{t.skip.map((a) => <Badge key={a} color="var(--c-text-dim)">{a}</Badge>)}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StateMachinesTab() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard title="Pipeline Run States">
          <StateGraph states={[
            { id: "pending", color: "#8b8d97", x: 60, y: 50 },
            { id: "running", color: "#5b8def", x: 200, y: 50 },
            { id: "completed", color: "#34d399", x: 340, y: 30 },
            { id: "failed", color: "#f87171", x: 340, y: 100 },
            { id: "paused", color: "#fbbf24", x: 200, y: 140 },
          ]} transitions={[
            { from: "pending", to: "running" },
            { from: "running", to: "completed" },
            { from: "running", to: "failed" },
            { from: "running", to: "paused" },
            { from: "paused", to: "running", label: "resume" },
          ]} triggers="initial | weekly_checkin | adjustment | manual" />
        </SectionCard>

        <SectionCard title="Program States">
          <StateGraph states={[
            { id: "active", color: "#34d399", x: 80, y: 50 },
            { id: "paused", color: "#fbbf24", x: 80, y: 140 },
            { id: "completed", color: "#5b8def", x: 300, y: 50 },
            { id: "cancelled", color: "#f87171", x: 300, y: 140 },
          ]} transitions={[
            { from: "active", to: "completed" },
            { from: "active", to: "paused" },
            { from: "active", to: "cancelled" },
            { from: "paused", to: "active", label: "resume" },
            { from: "paused", to: "cancelled" },
          ]} triggers="Phases: phase_0 → phase_1 → phase_2 | Tiers: tier_0 → tier_1 → tier_2" />
        </SectionCard>

        <SectionCard title="Training Session States">
          <StateGraph states={[
            { id: "scheduled", color: "#8b8d97", x: 80, y: 50 },
            { id: "completed", color: "#34d399", x: 300, y: 30 },
            { id: "skipped", color: "#fbbf24", x: 300, y: 90 },
            { id: "partial", color: "#F4A261", x: 300, y: 150 },
          ]} transitions={[
            { from: "scheduled", to: "completed", label: "log + complete" },
            { from: "scheduled", to: "skipped", label: "skip + reason" },
            { from: "scheduled", to: "partial" },
          ]} triggers="Created by pipeline worker from COACH output" />
        </SectionCard>

        <SectionCard title="Red Flag States">
          <StateGraph states={[
            { id: "detected", color: "#f87171", x: 60, y: 50 },
            { id: "acknowledged", color: "#fbbf24", x: 180, y: 50 },
            { id: "resolved", color: "#34d399", x: 300, y: 30 },
            { id: "referred", color: "#E63946", x: 300, y: 90 },
          ]} transitions={[
            { from: "detected", to: "acknowledged" },
            { from: "acknowledged", to: "resolved" },
            { from: "acknowledged", to: "referred" },
          ]} triggers="Severity: warning | serious | urgent" />
        </SectionCard>
      </div>
    </div>
  );
}

function StateGraph({ states, transitions, triggers }: { states: { id: string; color: string; x: number; y: number }[]; transitions: { from: string; to: string; label?: string }[]; triggers: string }) {
  return (
    <div>
      <svg viewBox="0 0 400 180" style={{ width: "100%", height: 180 }}>
        <defs><marker id="sg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth={6} markerHeight={6} orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-text-dim)" /></marker></defs>
        {transitions.map((t, i) => {
          const from = states.find((s) => s.id === t.from)!;
          const to = states.find((s) => s.id === t.to)!;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ox = (dx / dist) * 50;
          const oy = (dy / dist) * 15;
          return (
            <g key={i}>
              <line x1={from.x + ox} y1={from.y + oy} x2={to.x - ox} y2={to.y - oy} stroke="var(--c-text-dim)" strokeWidth={1.5} markerEnd="url(#sg)" />
              {t.label && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} textAnchor="middle" fill="var(--c-text-dim)" fontSize={8}>{t.label}</text>}
            </g>
          );
        })}
        {states.map((s) => (
          <g key={s.id}>
            <rect x={s.x - 48} y={s.y - 14} width={96} height={28} rx={14} fill={`${s.color}22`} stroke={s.color} strokeWidth={2} />
            <text x={s.x} y={s.y + 4} textAnchor="middle" fill={s.color} fontSize={11} fontWeight={700}>{s.id}</text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 10, color: "var(--c-text-dim)", marginTop: 4 }}>{triggers}</div>
    </div>
  );
}

const FEATURES: { domain: string; items: { id: string; name: string; status: "done" | "partial" | "stub" | "missing"; routes: string[]; tables: string[]; agents: string[]; deps: string[] }[] }[] = [
  { domain: "Temporal Loop", items: [
    { id: "T-1", name: "Check-in API + DB", status: "done", routes: ["POST /programs/:id/checkins", "GET /programs/:id/checkins", "GET .../summary"], tables: ["progress_entries", "programs"], agents: [], deps: [] },
    { id: "T-2", name: "Progress History Storage", status: "done", routes: [], tables: ["progress_entries", "training_sessions"], agents: [], deps: ["T-1"] },
    { id: "T-3", name: "Trigger Evaluation Engine", status: "done", routes: [], tables: ["adjustments"], agents: ["SCIENTIST"], deps: ["T-1", "T-2"] },
    { id: "T-4", name: "Partial Re-execution", status: "done", routes: ["POST /pipeline/run"], tables: ["pipeline_runs", "agent_outputs"], agents: ["*"], deps: ["T-3"] },
    { id: "T-5", name: "Training Session Logging", status: "done", routes: ["PUT /training-sessions/:id/log", "PATCH .../complete", "PATCH .../skip"], tables: ["training_sessions"], agents: [], deps: ["T-2"] },
    { id: "T-6", name: "Compliance Tracking", status: "done", routes: ["GET /programs/:id/compliance"], tables: ["progress_entries", "training_sessions"], agents: [], deps: ["T-1", "T-5"] },
    { id: "T-7", name: "Anomaly Detection & Cycle Detrending", status: "missing", routes: [], tables: [], agents: ["SCIENTIST"], deps: ["T-2", "T-3"] },
    { id: "T-8", name: "Predictive Trajectory Analysis", status: "partial", routes: ["GET /programs/:id/projection"], tables: ["progress_entries"], agents: ["SCIENTIST"], deps: ["T-2", "T-7"] },
  ]},
  { domain: "Output Quality", items: [
    { id: "Q-1", name: "Recipe Macro Verification (USDA)", status: "done", routes: [], tables: ["recipes", "foods"], agents: ["CHEF"], deps: [] },
    { id: "Q-2", name: "Cross-Agent Consistency Checks", status: "done", routes: [], tables: [], agents: ["*"], deps: [] },
    { id: "Q-3", name: "Golden Dataset & Evaluation", status: "missing", routes: [], tables: [], agents: ["*"], deps: ["DX-2"] },
    { id: "Q-4", name: "Hallucination Detection", status: "missing", routes: [], tables: [], agents: ["*"], deps: ["Q-1", "Q-3"] },
    { id: "Q-5", name: "Agent Self-Correction / Reflection", status: "missing", routes: [], tables: [], agents: ["*"], deps: [] },
    { id: "Q-6", name: "PHYSICIAN Audit Trail", status: "done", routes: [], tables: ["physician_queries", "red_flags"], agents: ["PHYSICIAN"], deps: [] },
    { id: "Q-7", name: "Referral Follow-up Tracking", status: "done", routes: ["GET /programs/:id/red-flags", "PATCH /red-flags/:id"], tables: ["red_flags"], agents: ["PHYSICIAN"], deps: ["Q-6"] },
    { id: "Q-9", name: "Prompt Versioning & A/B Testing", status: "missing", routes: [], tables: [], agents: ["*"], deps: ["Q-3"] },
  ]},
  { domain: "Infrastructure", items: [
    { id: "I-2", name: "Background Job Processing", status: "done", routes: [], tables: ["pipeline_runs"], agents: ["*"], deps: [] },
    { id: "I-4", name: "Observability", status: "done", routes: ["GET /admin/stats", "GET /admin/costs"], tables: ["agent_outputs", "pipeline_runs"], agents: [], deps: [] },
    { id: "I-5", name: "LLM Cost Optimization", status: "missing", routes: [], tables: [], agents: ["*"], deps: ["I-4"] },
    { id: "I-6", name: "Data Backup & Recovery", status: "missing", routes: ["GET /admin/export"], tables: ["*"], agents: [], deps: [] },
  ]},
  { domain: "Agent Intelligence", items: [
    { id: "A-1", name: "CHEF Recipe Memory", status: "done", routes: ["GET /recipes", "POST /recipes/:id/feedback"], tables: ["recipes"], agents: ["CHEF"], deps: [] },
    { id: "A-2", name: "COACH Autoregulation", status: "missing", routes: [], tables: [], agents: ["COACH"], deps: ["T-5"] },
    { id: "A-3", name: "DIETITIAN Substitution Learning", status: "missing", routes: [], tables: [], agents: ["DIETITIAN"], deps: ["T-6"] },
    { id: "A-4", name: "PHYSICIAN Proactive Monitoring", status: "done", routes: [], tables: ["red_flags"], agents: ["PHYSICIAN"], deps: ["T-2", "Q-6"] },
    { id: "A-5", name: "Cross-Agent Signal Propagation", status: "done", routes: [], tables: [], agents: ["*"], deps: ["T-6"] },
    { id: "A-6", name: "SCIENTIST Predictive Mode", status: "missing", routes: [], tables: [], agents: ["SCIENTIST"], deps: ["T-8"] },
  ]},
  { domain: "User Experience", items: [
    { id: "U-1", name: "User Communication Layer (chat)", status: "missing", routes: [], tables: [], agents: ["*"], deps: [] },
    { id: "U-2", name: "Notifications & Reminders", status: "done", routes: [], tables: ["notification_preferences", "notification_log"], agents: [], deps: ["T-1"] },
    { id: "U-3", name: "Progress Dashboard (end-user)", status: "missing", routes: ["GET /programs/:id/dashboard", "GET .../charts/*"], tables: ["progress_entries"], agents: [], deps: ["T-2"] },
    { id: "U-4", name: "Photo Tracking", status: "partial", routes: ["GET/POST /programs/:id/photos"], tables: ["progress_photos"], agents: [], deps: [] },
    { id: "U-5", name: "Training Session UI", status: "missing", routes: ["GET .../training/weeks/:w", "PUT/PATCH training-sessions"], tables: ["training_sessions"], agents: [], deps: ["T-5"] },
    { id: "U-6", name: "Meal Plan Viewer", status: "missing", routes: ["GET /programs/:id/meal-plan"], tables: ["agent_outputs"], agents: [], deps: [] },
    { id: "U-7", name: "Weekly Report", status: "partial", routes: [], tables: [], agents: [], deps: ["T-1", "T-2"] },
    { id: "U-8", name: "Adjustment Explanations", status: "done", routes: ["GET /programs/:id/adjustments"], tables: ["adjustments"], agents: [], deps: ["T-3"] },
    { id: "U-10", name: "Calendar & Schedule", status: "done", routes: ["GET .../calendar.ics", "GET .../schedule"], tables: ["programs"], agents: [], deps: [] },
    { id: "U-11", name: "Cultural & Calendar Awareness", status: "done", routes: ["GET/POST /programs/:id/disruptions"], tables: ["program_disruptions"], agents: [], deps: [] },
  ]},
  { domain: "Data & Knowledge", items: [
    { id: "D-1", name: "Recipe Database Accumulation", status: "done", routes: ["GET /recipes", "POST /recipes/:id/feedback"], tables: ["recipes"], agents: ["CHEF"], deps: ["Q-1"] },
    { id: "D-4", name: "Outcome Tracking & Self-Learning", status: "done", routes: ["GET /admin/outcomes"], tables: ["adjustments", "progress_entries"], agents: [], deps: ["T-2", "T-6"] },
    { id: "D-6", name: "Full Pipeline Run Archival", status: "done", routes: ["GET /admin/pipeline-runs/:id/trace"], tables: ["agent_outputs (llm_trace)"], agents: ["*"], deps: [] },
    { id: "D-7", name: "User Interaction Log", status: "done", routes: ["GET /programs/:id/messages"], tables: ["interaction_events"], agents: [], deps: [] },
    { id: "D-9", name: "Ingredient Price Tracking", status: "done", routes: ["GET/POST/DELETE /ingredient-prices"], tables: ["ingredient_prices"], agents: [], deps: [] },
  ]},
  { domain: "Integrations", items: [
    { id: "X-1", name: "Grocery/Shopping Lists", status: "done", routes: ["GET /programs/:id/shopping-list"], tables: ["agent_outputs"], agents: ["CHEF"], deps: [] },
    { id: "X-2", name: "Wearable Integrations", status: "stub", routes: ["POST/GET .../wearable-data (501)"], tables: [], agents: [], deps: [] },
    { id: "X-4", name: "Batch Cooking Planner", status: "done", routes: ["GET .../batch-cooking-plan"], tables: ["agent_outputs"], agents: ["CHEF"], deps: [] },
    { id: "X-5", name: "Technique Reference", status: "done", routes: ["GET /techniques", "GET /techniques/:name"], tables: [], agents: [], deps: [] },
    { id: "X-6", name: "Pantry & Inventory", status: "done", routes: ["GET/POST/PATCH/DELETE /pantry"], tables: ["pantry_items"], agents: [], deps: [] },
    { id: "X-7", name: "Recipe Scaling", status: "done", routes: ["GET /recipes/:id/scaled"], tables: ["recipes"], agents: [], deps: [] },
    { id: "X-8", name: "Cook Feedback", status: "done", routes: ["POST /recipes/:id/feedback"], tables: ["recipes"], agents: [], deps: [] },
  ]},
  { domain: "Lifecycle", items: [
    { id: "L-1", name: "Program Lifecycle", status: "done", routes: ["PATCH /programs/:id/status", "GET .../completion-check"], tables: ["programs"], agents: [], deps: ["T-2"] },
    { id: "L-2", name: "Milestone Detection", status: "done", routes: ["GET /programs/:id/milestones"], tables: ["milestones"], agents: [], deps: ["T-2"] },
    { id: "L-3", name: "Data-Driven Insights", status: "done", routes: ["GET /programs/:id/insights"], tables: ["progress_entries", "training_sessions"], agents: [], deps: ["T-2", "T-5"] },
    { id: "L-5", name: "Smart Timing", status: "done", routes: ["GET .../schedule"], tables: ["programs"], agents: [], deps: [] },
    { id: "L-6", name: "Low-Friction Re-engagement", status: "done", routes: ["PATCH /programs/:id/status (pause→active)"], tables: ["programs"], agents: [], deps: ["L-1"] },
    { id: "L-10", name: "Variety & Surprise", status: "done", routes: [], tables: ["recipes"], agents: ["CHEF", "COACH"], deps: [] },
    { id: "L-11", name: "Goal Visualization", status: "done", routes: ["GET .../projection"], tables: ["progress_entries"], agents: [], deps: [] },
  ]},
  { domain: "Developer Experience", items: [
    { id: "DX-1", name: "Agent Playground", status: "done", routes: [], tables: [], agents: ["*"], deps: [] },
    { id: "DX-2", name: "Seed Data", status: "done", routes: [], tables: ["users", "programs", "intake_responses"], agents: [], deps: [] },
    { id: "DX-3", name: "API Documentation (OpenAPI)", status: "missing", routes: [], tables: [], agents: [], deps: [] },
    { id: "DX-4", name: "Pipeline Execution Visualizer", status: "done", routes: ["GET /admin/pipeline-runs/*"], tables: ["pipeline_runs", "agent_outputs"], agents: [], deps: ["D-6"] },
    { id: "DX-5", name: "Dependency Graph / System Map", status: "done", routes: [], tables: [], agents: [], deps: [] },
    { id: "DX-6", name: "Agent I/O Inspector", status: "done", routes: ["GET /admin/agent-outputs"], tables: ["agent_outputs"], agents: [], deps: ["D-6"] },
    { id: "DX-7", name: "Cost & Token Dashboard", status: "done", routes: ["GET /admin/costs"], tables: ["agent_outputs"], agents: [], deps: ["I-4"] },
    { id: "DX-8", name: "Prompt Diff & History", status: "missing", routes: [], tables: [], agents: ["*"], deps: ["Q-9"] },
    { id: "DX-9", name: "Validation Report View", status: "missing", routes: [], tables: [], agents: [], deps: ["Q-1", "Q-2"] },
    { id: "DX-10", name: "Dev Environment Bootstrap", status: "done", routes: [], tables: [], agents: [], deps: [] },
    { id: "DX-11", name: "Agent Execution Replay", status: "missing", routes: [], tables: [], agents: [], deps: ["D-6", "DX-8"] },
  ]},
];

const STATUS_COLORS = { done: "#34d399", partial: "#fbbf24", stub: "#F4A261", missing: "#f87171" };

function FeatureMapTab() {
  const [filter, setFilter] = useState<"all" | "done" | "partial" | "missing">("all");
  const totals = { done: 0, partial: 0, stub: 0, missing: 0 };
  FEATURES.forEach((d) => d.items.forEach((i) => totals[i.status]++));

  return (
    <div>
      <SectionCard title="Feature Inventory" subtitle={`${totals.done} built · ${totals.partial + totals.stub} partial · ${totals.missing} missing · ${totals.done + totals.partial + totals.stub + totals.missing} total`}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["all", "done", "partial", "missing"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 12px", background: filter === f ? "var(--c-accent)" : "var(--c-surface-2)", border: "1px solid var(--c-border)", borderRadius: "var(--radius)", color: filter === f ? "#fff" : "var(--c-text)", cursor: "pointer", fontSize: 12 }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </SectionCard>

      {FEATURES.map((domain) => {
        const items = domain.items.filter((i) => filter === "all" || i.status === filter || (filter === "partial" && i.status === "stub"));
        if (items.length === 0) return null;
        return (
          <SectionCard key={domain.domain} title={domain.domain}>
            {items.map((item) => (
              <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--c-border)", display: "grid", gridTemplateColumns: "50px 1fr", gap: 12, alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-dim)" }}>{item.id}</div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[item.status], marginTop: 4 }} title={item.status} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name} <span style={{ fontSize: 11, color: STATUS_COLORS[item.status], fontWeight: 400 }}>({item.status})</span></div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                    {item.routes.length > 0 && <div><span style={{ fontSize: 10, color: "var(--c-text-dim)" }}>ROUTES: </span>{item.routes.map((r) => <span key={r} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--c-accent)", marginRight: 6 }}>{r}</span>)}</div>}
                    {item.tables.length > 0 && <div><span style={{ fontSize: 10, color: "var(--c-text-dim)" }}>TABLES: </span>{item.tables.map((t) => <span key={t} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--c-warning)", marginRight: 6 }}>{t}</span>)}</div>}
                    {item.agents.length > 0 && <div><span style={{ fontSize: 10, color: "var(--c-text-dim)" }}>AGENTS: </span>{item.agents.map((a) => <Badge key={a} color={AC[a] ?? "var(--c-text-dim)"}>{a}</Badge>)}</div>}
                    {item.deps.length > 0 && <div><span style={{ fontSize: 10, color: "var(--c-text-dim)" }}>DEPS: </span>{item.deps.map((d) => <span key={d} style={{ fontSize: 11, color: "var(--c-text-dim)", marginRight: 6 }}>{d}</span>)}</div>}
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        );
      })}
    </div>
  );
}

const DB_GROUPS: { name: string; color: string; tables: { name: string; keys: string; writtenBy: string; readBy: string }[] }[] = [
  { name: "Core Identity", color: "var(--c-accent)", tables: [
    { name: "users", keys: "id, created_at", writtenBy: "POST /intake", readBy: "programs, pipeline_runs" },
    { name: "intake_responses", keys: "id, user_id, data (JSONB — 69 fields)", writtenBy: "POST /intake", readBy: "POST /pipeline/run, POST /programs" },
  ]},
  { name: "Program State", color: "var(--c-success)", tables: [
    { name: "programs", keys: "id, user_id, status, phase, tier, week, weight_kg, target_weight_kg, macros, surplus", writtenBy: "POST /programs, check-in triggers, SCIENTIST output", readBy: "Almost everything — dashboard, charts, schedule, triggers" },
  ]},
  { name: "Pipeline Execution", color: "var(--c-warning)", tables: [
    { name: "pipeline_runs", keys: "id, program_id, trigger, status, agents_requested, current_agent, error, started_at, completed_at", writtenBy: "POST /programs, POST check-in (trigger), POST /pipeline/run", readBy: "Pipeline status, meal-plan, shopping-list, admin" },
    { name: "agent_outputs", keys: "id, pipeline_run_id, agent_name, envelope (JSONB), llm_trace (JSONB), duration_ms, llm_tokens_used", writtenBy: "Pipeline worker (per agent completion)", readBy: "Agent inspector, meal-plan, shopping-list, trace viewer" },
  ]},
  { name: "Progress Tracking", color: "#9B5DE5", tables: [
    { name: "progress_entries", keys: "id, program_id, week_number, weight_kg, waist_cm, hip_cm, cycle_phase, cycle_day, subjective_markers (JSONB), MVD count", writtenBy: "POST /programs/:id/checkins", readBy: "Charts, dashboard, triggers, insights, projection" },
    { name: "training_sessions", keys: "id, program_id, week, day, focus, warmup (JSONB), exercises (JSONB), status", writtenBy: "Pipeline worker (COACH output), PUT/PATCH training-sessions", readBy: "Training fetch, compliance, insights, triggers" },
    { name: "adjustments", keys: "id, program_id, pipeline_run_id, trigger_type, old_values, new_values, affected_agents, reason", writtenBy: "Check-in trigger engine", readBy: "Adjustment history, admin triggers, messages" },
    { name: "milestones", keys: "id, program_id, type, value, achieved_at", writtenBy: "Check-in milestone detection", readBy: "Milestones listing, messages, completion check" },
    { name: "interaction_events", keys: "id, program_id, event_type, actor, metadata", writtenBy: "Various user actions", readBy: "Messages feed" },
    { name: "progress_photos", keys: "id, program_id, week, photo_type, file_path", writtenBy: "POST /programs/:id/photos", readBy: "Photo listing" },
    { name: "program_disruptions", keys: "id, program_id, type, start_date, end_date, notes", writtenBy: "POST /programs/:id/disruptions", readBy: "Disruption listing" },
  ]},
  { name: "Health & Safety", color: "#E63946", tables: [
    { name: "red_flags", keys: "id, program_id, flag_type, severity, status, details, physician_query_id", writtenBy: "PHYSICIAN agent, check-in red flag detection", readBy: "Red flags listing, messages" },
    { name: "physician_queries", keys: "id, program_id, requesting_agent, query_type, urgency, response, pipeline_action", writtenBy: "PHYSICIAN agent (on-demand calls)", readBy: "Red flags" },
  ]},
  { name: "Nutrition & Recipes", color: "#E9C46A", tables: [
    { name: "recipes", keys: "id, recipe_name, cuisine, ingredients (JSONB), macros_per_serving, instructions, verified, rating", writtenBy: "Pipeline worker (CHEF output), POST feedback", readBy: "Recipe search/fetch/scale, shopping list" },
    { name: "foods", keys: "fdc_id, name, macros, micronutrients, portions (JSONB)", writtenBy: "USDA FDC client (cache)", readBy: "Recipe verification, nutrition tools" },
    { name: "ingredient_prices", keys: "id, ingredient_name, price_per_kg, store", writtenBy: "POST /ingredient-prices", readBy: "Ingredient price lookup" },
    { name: "pantry_items", keys: "id, name, category, quantity_g, expires_at", writtenBy: "POST /pantry", readBy: "Pantry listing" },
  ]},
  { name: "Communications", color: "#2A9D8F", tables: [
    { name: "notification_preferences", keys: "id, program_id, reminder settings (day/hour/enabled bools)", writtenBy: "Settings", readBy: "Notification scheduler" },
    { name: "notification_log", keys: "id, program_id, channel, title, body", writtenBy: "Notification service", readBy: "Messages feed" },
  ]},
];

function DataArchitectureTab() {
  return (
    <div>
      <SectionCard title="Database Architecture" subtitle="20 tables across 7 domains. PostgreSQL + Drizzle ORM. All IDs are UUIDs. JSONB for flexible agent outputs.">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {DB_GROUPS.map((g) => (
            <div key={g.name} style={{ padding: "4px 10px", background: "var(--c-surface-2)", borderRadius: "var(--radius)", fontSize: 11 }}>
              <span style={{ color: g.color, fontWeight: 600 }}>{g.name}</span>
              <span style={{ color: "var(--c-text-dim)", marginLeft: 6 }}>{g.tables.length} tables</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {DB_GROUPS.map((group) => (
        <SectionCard key={group.name} title={group.name}>
          {group.tables.map((t) => (
            <div key={t.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--c-border)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: group.color }}>{t.name}</div>
              <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--c-text-dim)", marginTop: 4 }}>{t.keys}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <div><span style={{ fontSize: 10, color: "var(--c-text-dim)" }}>WRITTEN BY: </span><span style={{ fontSize: 11 }}>{t.writtenBy}</span></div>
                <div><span style={{ fontSize: 10, color: "var(--c-text-dim)" }}>READ BY: </span><span style={{ fontSize: 11 }}>{t.readBy}</span></div>
              </div>
            </div>
          ))}
        </SectionCard>
      ))}
    </div>
  );
}

const API_GROUPS: { name: string; color: string; endpoints: { method: string; path: string; desc: string; tables: string }[] }[] = [
  { name: "Intake & Onboarding", color: "var(--c-accent)", endpoints: [
    { method: "POST", path: "/intake", desc: "Create user + intake response from questionnaire", tables: "→ users, intake_responses" },
  ]},
  { name: "Programs", color: "var(--c-success)", endpoints: [
    { method: "POST", path: "/programs", desc: "Create program from intake (triggers initial pipeline run)", tables: "→ programs, pipeline_runs" },
    { method: "GET", path: "/programs", desc: "List all programs", tables: "← programs" },
    { method: "GET", path: "/programs/:id", desc: "Fetch program details", tables: "← programs" },
    { method: "PATCH", path: "/programs/:id/status", desc: "Transition status (active/paused/completed/cancelled)", tables: "→ programs" },
    { method: "GET", path: "/programs/:id/completion-check", desc: "Check if program eligible for completion + generate summary", tables: "← programs, progress_entries, milestones" },
  ]},
  { name: "Pipeline", color: "var(--c-warning)", endpoints: [
    { method: "POST", path: "/pipeline/run", desc: "Queue pipeline execution (BullMQ job)", tables: "→ pipeline_runs" },
    { method: "GET", path: "/pipeline/:id", desc: "Get pipeline run status + all agent outputs", tables: "← pipeline_runs, agent_outputs" },
  ]},
  { name: "Check-ins", color: "var(--c-accent)", endpoints: [
    { method: "POST", path: "/programs/:id/checkins", desc: "Submit weekly check-in → trigger evaluation → possible re-run", tables: "→ progress_entries, programs, milestones, adjustments, pipeline_runs" },
    { method: "GET", path: "/programs/:id/checkins", desc: "List check-in history (paginated)", tables: "← progress_entries" },
    { method: "GET", path: "/programs/:id/checkins/summary", desc: "Summary stats: total gain, avg weekly rate, weeks on program", tables: "← progress_entries" },
  ]},
  { name: "Training", color: "#9B5DE5", endpoints: [
    { method: "GET", path: "/programs/:id/training/weeks/:week", desc: "Fetch training sessions for specified week", tables: "← training_sessions" },
    { method: "PUT", path: "/training-sessions/:id/log", desc: "Log actual exercise performance (weight, reps, RPE)", tables: "→ training_sessions" },
    { method: "PATCH", path: "/training-sessions/:id/complete", desc: "Mark session as completed", tables: "→ training_sessions" },
    { method: "PATCH", path: "/training-sessions/:id/skip", desc: "Mark session as skipped with reason", tables: "→ training_sessions" },
  ]},
  { name: "Nutrition & Recipes", color: "#E9C46A", endpoints: [
    { method: "GET", path: "/programs/:id/meal-plan", desc: "Fetch DIETITIAN template + CHEF recipes from latest pipeline run", tables: "← pipeline_runs, agent_outputs" },
    { method: "GET", path: "/programs/:id/shopping-list", desc: "Generate aggregated shopping list from latest CHEF output", tables: "← pipeline_runs, agent_outputs" },
    { method: "GET", path: "/programs/:id/batch-cooking-plan", desc: "Fetch batch cooking instructions from CHEF", tables: "← pipeline_runs, agent_outputs" },
    { method: "GET", path: "/recipes", desc: "Search recipes (cuisine, prep time, limit)", tables: "← recipes" },
    { method: "GET", path: "/recipes/:id", desc: "Fetch single recipe detail", tables: "← recipes" },
    { method: "GET", path: "/recipes/:id/scaled", desc: "Return recipe scaled by factor", tables: "← recipes" },
    { method: "POST", path: "/recipes/:id/feedback", desc: "Log recipe rating + difficulty + timing feedback", tables: "→ recipes" },
  ]},
  { name: "Dashboard & Charts", color: "var(--c-accent)", endpoints: [
    { method: "GET", path: "/programs/:id/dashboard", desc: "Progress KPIs (weight, rate, compliance, phase, tier)", tables: "← programs, progress_entries, adjustments" },
    { method: "GET", path: "/programs/:id/charts/weight", desc: "Weight progression data for charting", tables: "← progress_entries" },
    { method: "GET", path: "/programs/:id/charts/strength", desc: "Strength progression (max volume per exercise per week)", tables: "← training_sessions" },
    { method: "GET", path: "/programs/:id/charts/measurements", desc: "Waist/hip measurements + ratio over time", tables: "← progress_entries" },
    { method: "GET", path: "/programs/:id/projection", desc: "Project weight trajectory to target", tables: "← programs, progress_entries" },
    { method: "GET", path: "/programs/:id/insights", desc: "Generate data-driven insights from recent progress", tables: "← progress_entries, training_sessions" },
  ]},
  { name: "Health & Safety", color: "#E63946", endpoints: [
    { method: "GET", path: "/programs/:id/red-flags", desc: "List all red flags for program", tables: "← red_flags" },
    { method: "PATCH", path: "/red-flags/:id", desc: "Update flag status (acknowledged/resolved/referred)", tables: "→ red_flags" },
    { method: "GET", path: "/programs/:id/compliance", desc: "Calculate meal + training compliance percentages", tables: "← progress_entries, training_sessions" },
  ]},
  { name: "Schedule & Calendar", color: "#2A9D8F", endpoints: [
    { method: "GET", path: "/programs/:id/schedule", desc: "Calculate next check-in, measurement, training, batch cooking dates", tables: "← programs" },
    { method: "GET", path: "/programs/:id/calendar.ics", desc: "Export iCal file with all scheduled events", tables: "← programs" },
    { method: "GET", path: "/programs/:id/messages", desc: "Aggregate feed: adjustments + milestones + red flags + notifications", tables: "← adjustments, milestones, red_flags, notification_log" },
    { method: "GET", path: "/programs/:id/adjustments", desc: "Adjustment history with human-readable explanations", tables: "← adjustments" },
    { method: "GET", path: "/programs/:id/milestones", desc: "All achieved milestones (weight, training, discipline)", tables: "← milestones" },
  ]},
  { name: "Inventory & Pricing", color: "#F4A261", endpoints: [
    { method: "GET", path: "/pantry", desc: "List all pantry items", tables: "← pantry_items" },
    { method: "POST", path: "/pantry", desc: "Add pantry item with expiration", tables: "→ pantry_items" },
    { method: "PATCH", path: "/pantry/:id", desc: "Update pantry item quantity/details", tables: "→ pantry_items" },
    { method: "DELETE", path: "/pantry/:id", desc: "Remove pantry item", tables: "→ pantry_items" },
    { method: "GET", path: "/ingredient-prices", desc: "List or search ingredient prices", tables: "← ingredient_prices" },
    { method: "POST", path: "/ingredient-prices", desc: "Bulk insert ingredient prices", tables: "→ ingredient_prices" },
    { method: "DELETE", path: "/ingredient-prices/:id", desc: "Delete price entry", tables: "→ ingredient_prices" },
  ]},
  { name: "Media & Disruptions", color: "#9B5DE5", endpoints: [
    { method: "GET", path: "/programs/:id/photos", desc: "List progress photos by week", tables: "← progress_photos" },
    { method: "POST", path: "/programs/:id/photos", desc: "Log progress photo metadata", tables: "→ progress_photos" },
    { method: "GET", path: "/programs/:id/disruptions", desc: "List program disruptions (travel, illness, etc.)", tables: "← program_disruptions" },
    { method: "POST", path: "/programs/:id/disruptions", desc: "Log planned disruption", tables: "→ program_disruptions" },
    { method: "DELETE", path: "/disruptions/:id", desc: "Remove disruption", tables: "→ program_disruptions" },
  ]},
  { name: "Reference & Utilities", color: "var(--c-text-dim)", endpoints: [
    { method: "GET", path: "/techniques", desc: "List all culinary techniques", tables: "in-memory" },
    { method: "GET", path: "/techniques/:name", desc: "Fetch technique details", tables: "in-memory" },
    { method: "GET", path: "/agents/:name/output/:runId", desc: "Fetch specific agent output from a pipeline run", tables: "← agent_outputs" },
    { method: "GET", path: "/health", desc: "System health check (DB + queue + uptime)", tables: "none" },
    { method: "POST", path: "/programs/:id/wearable-data", desc: "Wearable data ingestion (NOT IMPLEMENTED — 501)", tables: "none" },
  ]},
  { name: "Admin & Observability", color: "var(--c-accent)", endpoints: [
    { method: "GET", path: "/admin/stats", desc: "Pipeline + agent aggregate stats", tables: "← pipeline_runs, agent_outputs, programs" },
    { method: "GET", path: "/admin/costs", desc: "Token cost breakdown by agent (Sonnet/Haiku pricing)", tables: "← agent_outputs" },
    { method: "GET", path: "/admin/outcomes", desc: "Adjustment outcome analysis", tables: "← adjustments, progress_entries" },
    { method: "GET", path: "/admin/pipeline-runs", desc: "List all pipeline runs (paginated, filterable)", tables: "← pipeline_runs, agent_outputs" },
    { method: "GET", path: "/admin/pipeline-runs/:id/trace", desc: "Full pipeline run + all agent outputs + llm_trace", tables: "← pipeline_runs, agent_outputs" },
    { method: "GET", path: "/admin/agent-outputs", desc: "Agent outputs across all runs (filterable by agent)", tables: "← agent_outputs, pipeline_runs" },
    { method: "GET", path: "/admin/triggers", desc: "All adjustments + trigger type summary counts", tables: "← adjustments" },
    { method: "GET", path: "/admin/tables", desc: "All table names + row counts", tables: "← information_schema" },
    { method: "GET", path: "/admin/tables/:name", desc: "Paginated rows from any whitelisted table", tables: "← [dynamic]" },
    { method: "GET", path: "/admin/export", desc: "Full database export (all tables as JSON)", tables: "← all tables" },
  ]},
];

const METHOD_COLORS: Record<string, { bg: string; fg: string }> = {
  GET: { bg: "#34d39922", fg: "#34d399" },
  POST: { bg: "#5b8def22", fg: "#5b8def" },
  PATCH: { bg: "#fbbf2422", fg: "#fbbf24" },
  PUT: { bg: "#F4A26122", fg: "#F4A261" },
  DELETE: { bg: "#f8717122", fg: "#f87171" },
};

function APISurfaceTab() {
  const totalEndpoints = API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);
  return (
    <div>
      <SectionCard title="API Surface" subtitle={`${totalEndpoints} endpoints across ${API_GROUPS.length} groups. All responses follow { success, data } / { success, error } format.`}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {API_GROUPS.map((g) => (
            <div key={g.name} style={{ padding: "4px 10px", background: "var(--c-surface-2)", borderRadius: "var(--radius)", fontSize: 11 }}>
              <span style={{ fontWeight: 600 }}>{g.name}</span>
              <span style={{ color: "var(--c-text-dim)", marginLeft: 6 }}>{g.endpoints.length}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {API_GROUPS.map((group) => (
        <SectionCard key={group.name} title={group.name}>
          {group.endpoints.map((ep, i) => {
            const mc = METHOD_COLORS[ep.method] ?? METHOD_COLORS.GET;
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--c-border)", display: "grid", gridTemplateColumns: "56px 1fr", gap: 8, alignItems: "start" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, textAlign: "center", background: mc.bg, color: mc.fg }}>{ep.method}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--c-text)" }}>{ep.path}</div>
                  <div style={{ fontSize: 12, color: "var(--c-text-dim)", marginTop: 2 }}>{ep.desc}</div>
                  <div style={{ fontSize: 10, color: "var(--c-text-dim)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{ep.tables}</div>
                </div>
              </div>
            );
          })}
        </SectionCard>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{children}</div>;
}

function Item({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--c-border)" }}>{children}</div>;
}
