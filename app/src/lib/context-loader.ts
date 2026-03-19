import {
  getSupervisors,
  getExperts,
  getCompanies,
  getTopics,
  getUniversities,
  getStudyPrograms,
  getFields,
} from "@/lib/data";
import type { ContextSource } from "@/types/gps";
import type { Field } from "@/types";

function fieldNames(fieldIds: string[], fieldMap: Map<string, Field>): string {
  return fieldIds.map((id) => fieldMap.get(id)?.name ?? id).join(", ");
}

type Loader = (fieldMap: Map<string, Field>) => Promise<string>;

const LOADERS: Record<ContextSource, Loader> = {
  async supervisors(fieldMap) {
    const items = await getSupervisors();
    const unis = new Map((await getUniversities()).map((u) => [u.id, u.name]));
    const lines = items.map((s, i) => {
      const parts = [
        `${i + 1}. ${s.title} ${s.firstName} ${s.lastName} — ${unis.get(s.universityId) ?? "University"}`,
        `   Research: ${s.researchInterests.join(", ")}`,
        `   Fields: ${fieldNames(s.fieldIds, fieldMap)}`,
      ];
      if (s.about) parts.push(`   About: ${s.about}`);
      return parts.join("\n");
    });
    return `## ATTACHED CONTEXT: Supervisors (${items.length} records)\n\n${lines.join("\n\n")}`;
  },

  async experts(fieldMap) {
    const items = await getExperts();
    const companies = new Map((await getCompanies()).map((c) => [c.id, c.name]));
    const lines = items.map((e, i) => {
      const parts = [
        `${i + 1}. ${e.firstName} ${e.lastName} — ${e.title} at ${companies.get(e.companyId) ?? "Company"}`,
        `   Fields: ${fieldNames(e.fieldIds, fieldMap)}`,
      ];
      if (e.about) parts.push(`   About: ${e.about}`);
      if (e.offerInterviews) parts.push(`   Offers interviews with students.`);
      return parts.join("\n");
    });
    return `## ATTACHED CONTEXT: Experts (${items.length} records)\n\n${lines.join("\n\n")}`;
  },

  async companies() {
    const items = await getCompanies();
    const lines = items.map((c, i) => {
      const parts = [
        `${i + 1}. ${c.name} (${c.size} employees)`,
        `   Domains: ${c.domains.join(", ")}`,
        `   ${c.description}`,
      ];
      if (c.about) parts.push(`   About: ${c.about}`);
      return parts.join("\n");
    });
    return `## ATTACHED CONTEXT: Companies (${items.length} records)\n\n${lines.join("\n\n")}`;
  },

  async topics(fieldMap) {
    const items = await getTopics();
    const companies = new Map((await getCompanies()).map((c) => [c.id, c.name]));
    const unis = new Map((await getUniversities()).map((u) => [u.id, u.name]));
    const lines = items.map((t, i) => {
      const owner = t.companyId
        ? companies.get(t.companyId) ?? ""
        : unis.get(t.universityId ?? "") ?? "";
      const kind = t.type === "job" ? "Industry" : "Academic";
      const parts = [
        `${i + 1}. ${t.title} (${kind}, from ${owner})`,
        `   Fields: ${fieldNames(t.fieldIds, fieldMap)}`,
        `   Degrees: ${t.degrees.join(", ")}`,
        `   ${t.description}`,
      ];
      if (t.employment === "yes" && t.employmentType) {
        parts.push(`   Employment: ${t.employmentType}`);
      }
      return parts.join("\n");
    });
    return `## ATTACHED CONTEXT: Topics (${items.length} records)\n\n${lines.join("\n\n")}`;
  },

  async universities() {
    const items = await getUniversities();
    const lines = items.map((u, i) => {
      const parts = [
        `${i + 1}. ${u.name} (${u.country})`,
        `   Domains: ${u.domains.join(", ")}`,
      ];
      if (u.about) parts.push(`   About: ${u.about}`);
      return parts.join("\n");
    });
    return `## ATTACHED CONTEXT: Universities (${items.length} records)\n\n${lines.join("\n\n")}`;
  },

  async programs() {
    const items = await getStudyPrograms();
    const unis = new Map((await getUniversities()).map((u) => [u.id, u.name]));
    const lines = items.map((p, i) => {
      const parts = [
        `${i + 1}. ${p.name} — ${p.degree.toUpperCase()} at ${unis.get(p.universityId) ?? "University"}`,
      ];
      if (p.about) parts.push(`   About: ${p.about}`);
      return parts.join("\n");
    });
    return `## ATTACHED CONTEXT: Study Programs (${items.length} records)\n\n${lines.join("\n\n")}`;
  },
};

/**
 * Loads the selected data collections and formats them as readable text
 * blocks ready to be injected into an agent prompt.
 */
export async function loadContextData(
  sources: ContextSource[],
): Promise<string> {
  if (sources.length === 0) return "";

  const fieldMap = new Map((await getFields()).map((f) => [f.id, f]));
  const blocks = await Promise.all(
    sources.map((source) => LOADERS[source](fieldMap)),
  );

  return blocks.join("\n\n───────────────────────────────────────\n\n");
}
