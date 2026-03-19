import type { Field } from "@/types";

export function resolveFieldNames(
  fieldIds: string[],
  fieldMap: Map<string, Field>,
): string[] {
  return fieldIds.map((id) => fieldMap.get(id)?.name ?? id);
}

export function buildSupervisorDoc(
  sup: {
    title: string;
    firstName: string;
    lastName: string;
    researchInterests: string[];
    about: string | null;
    objectives: string[];
  },
  uniName: string,
  fieldNames: string[],
): string {
  const parts = [
    `${sup.title} ${sup.firstName} ${sup.lastName}`,
    `University: ${uniName}`,
    `Research interests: ${sup.researchInterests.join(", ")}`,
    `Fields: ${fieldNames.join(", ")}`,
  ];
  if (sup.about) parts.push(`About: ${sup.about}`);
  if (sup.objectives.length) parts.push(`Goals: ${sup.objectives.join(", ")}`);
  return parts.join("\n");
}

export function buildExpertDoc(
  exp: {
    firstName: string;
    lastName: string;
    title: string;
    about: string | null;
    offerInterviews: boolean;
    objectives: string[];
  },
  companyName: string,
  fieldNames: string[],
): string {
  const parts = [
    `${exp.firstName} ${exp.lastName} — ${exp.title}`,
    `Company: ${companyName}`,
    `Fields: ${fieldNames.join(", ")}`,
  ];
  if (exp.about) parts.push(`About: ${exp.about}`);
  if (exp.offerInterviews) parts.push("Available for interviews with students.");
  if (exp.objectives.length) parts.push(`Goals: ${exp.objectives.join(", ")}`);
  return parts.join("\n");
}

export function buildCompanyDoc(comp: {
  name: string;
  description: string;
  about: string | null;
  size: string;
  domains: string[];
}): string {
  const parts = [
    `${comp.name} (${comp.size} employees)`,
    `Domains: ${comp.domains.join(", ")}`,
    comp.description,
  ];
  if (comp.about) parts.push(`About: ${comp.about}`);
  return parts.join("\n");
}

export function buildTopicDoc(
  topic: {
    title: string;
    description: string;
    type: string;
    employment: string;
    employmentType: string | null;
    degrees: string[];
  },
  ownerName: string,
  fieldNames: string[],
): string {
  const kind = topic.type === "job" ? "Industry thesis" : "Academic thesis";
  const parts = [
    `${topic.title} (${kind})`,
    `From: ${ownerName}`,
    `Fields: ${fieldNames.join(", ")}`,
    `Degrees: ${topic.degrees.join(", ")}`,
    topic.description,
  ];
  if (topic.employment === "yes" && topic.employmentType) {
    parts.push(`Employment: ${topic.employmentType}`);
  } else if (topic.employment === "open") {
    parts.push("Employment possible");
  }
  return parts.join("\n");
}

export function buildUniversityDoc(uni: {
  name: string;
  country: string;
  domains: string[];
  about: string | null;
}): string {
  const parts = [
    `${uni.name} (${uni.country})`,
    `Domains: ${uni.domains.join(", ")}`,
  ];
  if (uni.about) parts.push(`About: ${uni.about}`);
  return parts.join("\n");
}

export function buildProgramDoc(
  prog: { name: string; degree: string; about: string | null },
  uniName: string,
): string {
  const parts = [
    `${prog.name} — ${prog.degree.toUpperCase()} program`,
    `University: ${uniName}`,
  ];
  if (prog.about) parts.push(`About: ${prog.about}`);
  return parts.join("\n");
}
