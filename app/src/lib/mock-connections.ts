export type MutualConnectionRole = "student" | "alumni" | "supervisor";

export interface MutualConnection {
  id: string;
  name: string;
  role: MutualConnectionRole;
  context: string; // e.g. "BSc Thesis at Nestlé (2024)"
}

const POOL: MutualConnection[] = [
  { id: "mc-01", name: "Sophie Müller", role: "student", context: "MSc Thesis at Nestlé (2024)" },
  { id: "mc-02", name: "Jonas Weber", role: "alumni", context: "Internship at Roche – Data Science (2023)" },
  { id: "mc-03", name: "Elena Rossi", role: "student", context: "BSc Project with Prof. Keller's lab (2024)" },
  { id: "mc-04", name: "Tom Bachmann", role: "supervisor", context: "Co-supervised thesis with this expert (2023)" },
  { id: "mc-05", name: "Ines Favre", role: "alumni", context: "Working Student at ABB – AI Team (2024)" },
  { id: "mc-06", name: "Marco Senn", role: "student", context: "Semester Project at Zurich Insurance (2023)" },
  { id: "mc-07", name: "Lena Hoffmann", role: "alumni", context: "Research Internship at Novartis (2022)" },
  { id: "mc-08", name: "David Keller", role: "supervisor", context: "Joint research project (2023–2024)" },
];

/** Deterministically returns 0 (most of the time) or 1–3 connections for a given expert id. */
export function getMockMutualConnections(expertId: string): MutualConnection[] {
  // Simple hash: sum char codes of the id
  const hash = expertId
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  // ~25% chance of having connections: only when hash % 4 === 0
  if (hash % 4 !== 0) return [];

  const count = (hash % 3) + 1; // 1, 2, or 3
  const start = hash % POOL.length;

  return Array.from({ length: count }, (_, i) => POOL[(start + i) % POOL.length]);
}
