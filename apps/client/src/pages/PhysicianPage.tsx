import { useState } from "react";
import { useProgramId } from "../context/ProgramContext";
import { useQuery } from "../hooks/use-query";
import { useMutation } from "../hooks/use-mutation";
import { TextField } from "../components/fields";
import type { PhysicianAnswer, PhysicianQueryRow } from "../api/types";

function AnswerCard({ answer }: { answer: Omit<PhysicianAnswer, "query_id"> }) {
  return (
    <div className="card">
      {answer.referral_needed ? (
        <div className={`badge ${answer.urgency === "urgent" ? "high" : "medium"}`} style={{ marginBottom: 8 }}>
          See a professional: {answer.referral_target ?? "healthcare provider"} ({answer.urgency})
        </div>
      ) : null}
      <p>{answer.response}</p>
      <h2 style={{ marginTop: 12 }}>How it works</h2>
      <p className="muted">{answer.mechanism_explained}</p>
      {answer.timeline ? (
        <p className="muted" style={{ marginTop: 6 }}>Expected timeline: {answer.timeline}</p>
      ) : null}
      {answer.sources.length > 0 ? (
        <>
          <h2 style={{ marginTop: 12 }}>Sources</h2>
          <ul className="bullets">
            {answer.sources.map((s, i) => (
              <li key={i}>
                {s.author} ({s.year}){s.publication ? `, ${s.publication}` : ""} — {s.finding}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="muted" style={{ marginTop: 12, fontSize: "0.75rem" }}>{answer.disclaimer}</p>
    </div>
  );
}

export function PhysicianPage() {
  const { programId } = useProgramId();
  const { mutate, loading } = useMutation<PhysicianAnswer>();
  const { data: history, refetch } = useQuery<PhysicianQueryRow[]>(
    programId ? `/programs/${programId}/physician/queries` : null
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<PhysicianAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openHistory, setOpenHistory] = useState<string | null>(null);

  const submit = async () => {
    if (!programId || question.trim().length < 5) {
      setError("Ask a real question (at least a few words).");
      return;
    }
    setError(null);
    setAnswer(null);
    try {
      const res = await mutate(`/programs/${programId}/physician/ask`, "POST", {
        question: question.trim(),
      });
      setAnswer(res);
      setQuestion("");
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    }
  };

  return (
    <>
      <h1>Health questions</h1>
      <p className="page-sub">
        Evidence-based answers with sources. Educational context, not medical advice.
      </p>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="card">
        <TextField
          label="Your question"
          hint="e.g. training during your period, bloating, supplements"
          multiline
          value={question}
          onChange={setQuestion}
          placeholder="Ask anything health-related about your program"
        />
        <button type="button" className="btn" disabled={loading} onClick={submit}>
          {loading ? "Thinking… (about 15 seconds)" : "Ask"}
        </button>
      </div>

      {answer ? <AnswerCard answer={answer} /> : null}

      {history && history.length > 0 ? (
        <div className="card">
          <h2>Previous questions</h2>
          <ul className="plain">
            {history.map((q) => (
              <li key={q.id} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ width: "100%", textAlign: "left", minHeight: 32, padding: 0 }}
                  onClick={() => setOpenHistory(openHistory === q.id ? null : q.id)}
                >
                  {q.query}
                </button>
                <div className="muted" style={{ fontSize: "0.75rem" }}>
                  {new Date(q.created_at).toLocaleDateString()} · {q.urgency}
                </div>
                {openHistory === q.id && q.response ? <AnswerCard answer={q.response} /> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
