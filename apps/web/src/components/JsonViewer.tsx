import { useState } from "react";

export function JsonViewer({ data, defaultExpanded = 1 }: { data: unknown; defaultExpanded?: number }) {
  return (
    <div className="json-viewer">
      <JsonNode value={data} depth={0} defaultExpanded={defaultExpanded} />
    </div>
  );
}

function JsonNode({ value, depth, defaultExpanded }: { value: unknown; depth: number; defaultExpanded: number }) {
  const [expanded, setExpanded] = useState(depth < defaultExpanded);

  if (value === null) return <span className="json-null">null</span>;
  if (typeof value === "boolean") return <span className="json-bool">{String(value)}</span>;
  if (typeof value === "number") return <span className="json-number">{value}</span>;
  if (typeof value === "string") {
    if (value.length > 200) {
      return <span className="json-string">"{value.slice(0, 200)}..."</span>;
    }
    return <span className="json-string">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>{"[]"}</span>;
    return (
      <span>
        <span className="json-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? "▼" : "▶"} [{value.length}]
        </span>
        {expanded && (
          <div style={{ paddingLeft: 16 }}>
            {value.map((item, i) => (
              <div key={i}>
                <JsonNode value={item} depth={depth + 1} defaultExpanded={defaultExpanded} />
                {i < value.length - 1 && ","}
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{"{}"}</span>;
    return (
      <span>
        <span className="json-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? "▼" : "▶"} {"{"}
          {!expanded && `${entries.length} keys}`}
        </span>
        {expanded && (
          <div style={{ paddingLeft: 16 }}>
            {entries.map(([k, v], i) => (
              <div key={k}>
                <span className="json-key">"{k}"</span>:{" "}
                <JsonNode value={v} depth={depth + 1} defaultExpanded={defaultExpanded} />
                {i < entries.length - 1 && ","}
              </div>
            ))}
            {"}"}
          </div>
        )}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}
