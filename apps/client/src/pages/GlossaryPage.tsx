import { useEffect } from "react";
import { useLocation } from "react-router";
import { GLOSSARY } from "@mo/shared";

export function GlossaryPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ block: "start" });
    }
  }, [location.hash]);

  return (
    <>
      <h1>Glossary</h1>
      <p className="page-sub">Every term the program uses, in plain language.</p>
      {GLOSSARY.map((entry) => (
        <div className="card" key={entry.id} id={entry.id}>
          <h2>{entry.term}</h2>
          <p className="muted" style={{ marginTop: 6 }}>{entry.definition}</p>
        </div>
      ))}
    </>
  );
}
