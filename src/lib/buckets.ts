// Groups a guide's sections into ordered categories, exactly like the original.
// Sections that share a `group` end up under one category heading in the nav.
import type { Section } from "./guide-types";

export interface Bucketed {
  order: string[];
  byG: Record<string, { s: Section; i: number }[]>;
}

export function bucket(sections: Section[]): Bucketed {
  const order: string[] = [];
  const byG: Record<string, { s: Section; i: number }[]> = {};
  sections.forEach((s, i) => {
    const g = s.group || "More";
    if (!byG[g]) { byG[g] = []; order.push(g); }
    byG[g].push({ s, i });
  });
  return { order, byG };
}
