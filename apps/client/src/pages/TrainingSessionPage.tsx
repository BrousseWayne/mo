import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import { useMutation } from "../hooks/use-mutation";
import type { Program, TrainingSession } from "../api/types";

interface SetInput {
  weight: string;
  reps: string;
  rpe: string;
}

type LogState = Record<string, SetInput[]>;

function initLog(session: TrainingSession): LogState {
  const log: LogState = {};
  for (const ex of session.exercises) {
    log[ex.name] = Array.from({ length: ex.sets }, (_, i) => ({
      weight: ex.actual?.[i]?.weight_kg?.toString() ?? "",
      reps: ex.actual?.[i]?.reps?.toString() ?? "",
      rpe: ex.actual?.[i]?.rpe?.toString() ?? "",
    }));
  }
  return log;
}

export function TrainingSessionPage() {
  const { sessionId } = useParams();
  const { programId } = useProgramId();
  const navigate = useNavigate();
  const { data: program } = useQuery<Program>(programId ? `/programs/${programId}` : null);
  const week = program?.current_week ?? null;
  const { data: sessions, loading, refetch } = useQuery<TrainingSession[]>(
    programId && week ? `/programs/${programId}/training/weeks/${week}` : null
  );
  const session = sessions?.find((s) => s.id === sessionId) ?? null;

  const { mutate, loading: saving, error: mutationError } = useMutation<TrainingSession>();
  const [log, setLog] = useState<LogState | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session && !log) setLog(initLog(session));
  }, [session, log]);

  if (loading || !program) return <div className="page-loading">Loading…</div>;
  if (!session) {
    return <div className="error-box">Session not found in the current week.</div>;
  }

  const updateSet = (exercise: string, index: number, field: keyof SetInput, value: string) => {
    setLog((l) => {
      if (!l) return l;
      const sets = l[exercise].map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return { ...l, [exercise]: sets };
    });
    setSaved(false);
  };

  const saveLog = async () => {
    if (!log) return;
    const actuals = Object.entries(log)
      .map(([exerciseName, sets]) => ({
        exerciseName,
        sets: sets
          .filter((s) => s.weight !== "" && s.reps !== "")
          .map((s) => ({
            weight_kg: Number(s.weight),
            reps: Number(s.reps),
            ...(s.rpe !== "" ? { rpe: Number(s.rpe) } : {}),
          })),
      }))
      .filter((e) => e.sets.length > 0);
    if (actuals.length === 0) return;
    await mutate(`/training-sessions/${session.id}/log`, "PUT", { actuals });
    setSaved(true);
    refetch();
  };

  const complete = async () => {
    await saveLog().catch(() => {});
    await mutate(`/training-sessions/${session.id}/complete`, "PATCH");
    navigate("/training");
  };

  const skip = async () => {
    await mutate(`/training-sessions/${session.id}/skip`, "PATCH", {});
    navigate("/training");
  };

  return (
    <>
      <h1 style={{ textTransform: "capitalize" }}>{session.day_of_week}</h1>
      <p className="page-sub">{session.focus}</p>
      {mutationError ? <div className="error-box">{mutationError}</div> : null}
      {saved ? <div className="success-box">Log saved.</div> : null}

      <div className="card">
        <h2>Warmup</h2>
        <ul className="bullets">
          {session.warmup.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>

      {session.exercises.map((ex) => (
        <div className="card" key={ex.name}>
          <div className="slot-head">
            <span className="slot-name">{ex.name}</span>
            <span className="badge low">RPE {ex.target_rpe}</span>
          </div>
          <div className="muted">
            {ex.sets} × {ex.reps} · rest {ex.rest_sec}s
          </div>
          <div className="muted" style={{ marginTop: 4 }}>{ex.notes}</div>
          <div className="set-header">
            <span>Set</span>
            <span>kg</span>
            <span>reps</span>
            <span>RPE</span>
          </div>
          {(log?.[ex.name] ?? []).map((set, i) => (
            <div className="set-row" key={i}>
              <span className="set-num">{i + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                value={set.weight}
                onChange={(e) => updateSet(ex.name, i, "weight", e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                value={set.reps}
                onChange={(e) => updateSet(ex.name, i, "reps", e.target.value)}
              />
              <input
                type="number"
                inputMode="decimal"
                value={set.rpe}
                onChange={(e) => updateSet(ex.name, i, "rpe", e.target.value)}
              />
            </div>
          ))}
        </div>
      ))}

      {session.status === "scheduled" || session.status === "partial" ? (
        <>
          <button type="button" className="btn secondary" disabled={saving} onClick={saveLog} style={{ marginBottom: 10 }}>
            Save log
          </button>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn secondary" disabled={saving} onClick={skip}>
              Skip session
            </button>
            <button type="button" className="btn" disabled={saving} onClick={complete}>
              Mark complete
            </button>
          </div>
        </>
      ) : (
        <div className="card">
          <span className={`badge status-${session.status}`}>{session.status}</span>
          {session.completed_at ? (
            <span className="muted" style={{ marginLeft: 8 }}>
              {new Date(session.completed_at).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      )}
    </>
  );
}
