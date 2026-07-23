import { Link } from "react-router";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import type { DashboardData, Program } from "../api/types";

function ProgressRing({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="Progress to target weight">
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--ink)">
        {current.toFixed(1)}
      </text>
      <text x="64" y="80" textAnchor="middle" fontSize="11" fill="var(--muted)">
        of {target} kg
      </text>
    </svg>
  );
}

function phaseLabel(value: string): string {
  return value.replace("_", " ").replace(/^([a-z])/, (m) => m.toUpperCase());
}

export function DashboardPage() {
  const { programId } = useProgramId();
  const { data, loading, error } = useQuery<DashboardData>(
    programId ? `/programs/${programId}/dashboard` : null
  );
  const { data: program } = useQuery<Program>(programId ? `/programs/${programId}` : null);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return null;

  const toGo = Math.max(0, data.target_weight_kg - data.current_weight_kg);
  const proteinKcal = (program?.protein_g ?? 0) * 4;
  const carbsKcal = (program?.carbs_g ?? 0) * 4;
  const fatKcal = (program?.fat_g ?? 0) * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal;

  return (
    <>
      <h1>Your progress</h1>
      <p className="page-sub">
        {toGo > 0
          ? `${toGo.toFixed(1)} kg of healthy mass still to build — every kilo counts.`
          : "Target reached — incredible work."}
      </p>

      <div className="card">
        <div className="ring-wrap">
          <ProgressRing current={data.current_weight_kg} target={data.target_weight_kg} />
          <div>
            <div className="kpi-value" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              {data.weekly_rate_avg > 0 ? "+" : ""}
              {data.weekly_rate_avg.toFixed(2)} kg/week
            </div>
            <div className="muted">average rate</div>
            <div style={{ marginTop: 8 }}>
              <span className="badge low">{phaseLabel(data.current_phase)}</span>{" "}
              <span className="badge medium">{phaseLabel(data.current_tier)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-value">{data.days_on_program}</div>
          <div className="kpi-label">days on program</div>
        </div>
        <div className="kpi">
          <div className="kpi-value">{data.compliance_pct}%</div>
          <div className="kpi-label">meal adherence</div>
        </div>
      </div>

      {program ? (
        <div className="card">
          <h2>Daily targets</h2>
          <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            {program.target_intake_kcal} kcal{" "}
            <span className="muted" style={{ fontWeight: 400 }}>
              (+{program.surplus_kcal} surplus)
            </span>
          </div>
          {totalKcal > 0 ? (
            <>
              <div className="macro-bar">
                <div className="protein" style={{ width: `${(proteinKcal / totalKcal) * 100}%` }} />
                <div className="carbs" style={{ width: `${(carbsKcal / totalKcal) * 100}%` }} />
                <div className="fat" style={{ width: `${(fatKcal / totalKcal) * 100}%` }} />
              </div>
              <div className="macro-legend">
                <span>
                  <span className="legend-dot" style={{ background: "var(--protein)" }} />
                  Protein {program.protein_g}g
                </span>
                <span>
                  <span className="legend-dot" style={{ background: "var(--carbs)" }} />
                  Carbs {program.carbs_g}g
                </span>
                <span>
                  <span className="legend-dot" style={{ background: "var(--fat)" }} />
                  Fat {program.fat_g}g
                </span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {data.recent_adjustments.length > 0 ? (
        <div className="card">
          <h2>Recent adjustments</h2>
          <ul className="plain">
            {data.recent_adjustments.map((adj) => (
              <li key={adj.id}>
                <strong>{adj.trigger_type.replace(/_/g, " ")}</strong>
                {adj.reason ? <div className="muted">{adj.reason}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card">
        <h2>This week</h2>
        <Link to="/checkin" className="btn" style={{ textDecoration: "none", marginBottom: 10 }}>
          Do your weekly check-in
        </Link>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <Link to="/meals" className="btn secondary" style={{ textDecoration: "none" }}>
            Meal plan
          </Link>
          <Link to="/training" className="btn secondary" style={{ textDecoration: "none" }}>
            Training
          </Link>
        </div>
      </div>
    </>
  );
}
