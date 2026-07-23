export function extractSection(md: string, heading: string): string {
  const lines = md.split("\n");
  const level = heading.match(/^#+/)?.[0].length ?? 2;
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) {
    throw new Error(`Section not found: ${heading}`);
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => {
    const m = l.match(/^(#+)\s/);
    return m !== null && m[1].length <= level;
  });
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

export function parseTable(section: string): string[][] {
  return section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"))
    .filter((l) => !/^\|[\s\-|]+\|$/.test(l))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );
}

export function parseBullets(section: string): string[] {
  return section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

export function midpoint(range: string): number {
  const nums = range.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) {
    throw new Error(`No numbers in range: ${range}`);
  }
  const values = nums.map(Number);
  return Math.round((values[0] + values[values.length - 1]) / 2);
}
