import { Link } from "react-router";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import type { Program, TrainingSession } from "../api/types";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function TrainingWeekPage() {
  const { programId } = useProgramId();
  const { data: program } = useQuery<Program>(programId ? `/programs/${programId}` : null);
  const week = program?.current_week ?? null;
  const { data: sessions, loading, error } = useQuery<TrainingSession[]>(
    programId && week ? `/programs/${programId}/training/weeks/${week}` : null
  );

  if (loading || !program) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="error-box">{error}</div>;

  const sorted = (sessions ?? [])
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));

  return (
    <>
      <h1>Training — week {week}</h1>
      <p className="page-sub">
        {program.current_phase === "phase_0"
          ? "Phase 0: movement quality only. Light loads, RPE 5-6, no grinding."
          : "Log what you actually lift — that's what drives progression."}
      </p>
      {sorted.length === 0 ? (
        <div className="card">
          <p className="muted">No sessions scheduled this week.</p>
        </div>
      ) : (
        sorted.map((s) => (
          <Link key={s.id} to={`/training/${s.id}`} className="session-link">
            <div className="card">
              <div className="slot-head">
                <span className="slot-name" style={{ textTransform: "capitalize" }}>
                  {s.day_of_week}
                </span>
                <span className={`badge status-${s.status}`}>{s.status}</span>
              </div>
              <div style={{ fontWeight: 600 }}>{s.focus}</div>
              <div className="muted">{s.exercises.length} exercises</div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
