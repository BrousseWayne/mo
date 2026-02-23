const COLORS: Record<string, string> = {
  SCIENTIST: "#457B9D",
  NUTRITIONIST: "#2A9D8F",
  DIETITIAN: "#F4A261",
  CHEF: "#E9C46A",
  COACH: "#9B5DE5",
  PHYSICIAN: "#E63946",
};

export function AgentBadge({ name }: { name: string }) {
  const color = COLORS[name] ?? "#8b8d97";
  return (
    <span className="badge" style={{ background: `${color}22`, color, borderLeft: `3px solid ${color}` }}>
      {name}
    </span>
  );
}
