import {
  getSupervisors,
  getExperts,
  getCompanies,
  getFields,
  getUniversities,
  getStudyPrograms,
  getTopics,
  getStudent,
  getProject,
} from "@/lib/data";
import { computeMatch } from "@/lib/matching";
import type { RecommendationRequest, Recommendation, RecommendationType } from "@/types/gps";
import type { Field } from "@/types";

/**
 * Studyond Scout — searches ALL mock data for entities matching the user's need.
 * Searches supervisors, experts, companies, topics, universities, and study programs.
 * Returns the best matches across all sources, ranked by combined score.
 */
export async function findRecommendations(
  request: RecommendationRequest,
  projectId: string,
  maxResults = 5
): Promise<Recommendation[]> {
  const [fields, universities, companies, studyPrograms, supervisors, experts, topics, project] =
    await Promise.all([
      getFields(),
      getUniversities(),
      getCompanies(),
      getStudyPrograms(),
      getSupervisors(),
      getExperts(),
      getTopics(),
      getProject(projectId),
    ]);

  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const uniMap = new Map(universities.map((u) => [u.id, u.name]));
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  // Resolve the student's field IDs for matching
  const student = project ? await getStudent(project.studentId) : null;
  const studentFieldIds = student?.fieldIds ?? [];

  // Find field IDs that match the keywords
  const keywordFieldIds = resolveKeywordFields(request.keywords, fields);
  const searchFieldIds = [...new Set([...studentFieldIds, ...keywordFieldIds])];

  const kw = request.keywords.map((k) => k.toLowerCase());

  // If a specific type is requested, only search that type
  // Otherwise, search EVERYTHING and return the best mix
  const searchAll = request.type === "all";
  const results: Recommendation[] = [];

  // --- Supervisors ---
  if (searchAll || request.type === "supervisor") {
    for (const sup of supervisors) {
      const fieldScore = computeMatch(searchFieldIds, sup.fieldIds).score;
      const text = textMatchScore(kw, ...sup.researchInterests, sup.about, sup.firstName + " " + sup.lastName, sup.title);
      const score = fieldScore * 0.5 + text * 0.5;
      if (score > 0) {
        results.push({
          id: sup.id,
          type: "supervisor",
          name: `${sup.title} ${sup.firstName} ${sup.lastName}`,
          title: sup.researchInterests.slice(0, 3).join(", "),
          affiliation: uniMap.get(sup.universityId) ?? "University",
          email: sup.email,
          reason: request.reason,
          matchScore: Math.min(score, 1),
          fieldNames: resolveFieldNames(sup.fieldIds, fieldMap),
        });
      }
    }
  }

  // --- Experts ---
  if (searchAll || request.type === "expert") {
    for (const exp of experts) {
      const fieldScore = computeMatch(searchFieldIds, exp.fieldIds).score;
      const companyName = companyMap.get(exp.companyId) ?? "";
      const text = textMatchScore(kw, exp.title, exp.about, exp.firstName + " " + exp.lastName, companyName);
      const score = fieldScore * 0.5 + text * 0.5;
      if (score > 0) {
        results.push({
          id: exp.id,
          type: "expert",
          name: `${exp.firstName} ${exp.lastName}`,
          title: exp.title,
          affiliation: companyName || "Company",
          email: exp.email,
          reason: request.reason,
          matchScore: Math.min(score, 1),
          fieldNames: resolveFieldNames(exp.fieldIds, fieldMap),
        });
      }
    }
  }

  // --- Companies ---
  if (searchAll || request.type === "company") {
    for (const comp of companies) {
      const text = textMatchScore(kw, comp.name, comp.description, comp.about, ...comp.domains);
      if (text > 0) {
        results.push({
          id: comp.id,
          type: "company",
          name: comp.name,
          title: comp.domains.slice(0, 3).join(", "),
          affiliation: `${comp.size} employees`,
          email: "",
          reason: request.reason,
          matchScore: Math.min(text, 1),
          fieldNames: comp.domains.slice(0, 3),
        });
      }
    }
  }

  // --- Topics ---
  if (searchAll || request.type === "topic") {
    for (const topic of topics) {
      const fieldScore = computeMatch(searchFieldIds, topic.fieldIds).score;
      const ownerName = topic.companyId
        ? companyMap.get(topic.companyId) ?? ""
        : uniMap.get(topic.universityId ?? "") ?? "";
      const text = textMatchScore(kw, topic.title, topic.description, ownerName);
      const score = fieldScore * 0.5 + text * 0.5;
      if (score > 0) {
        const employmentTag = topic.employment === "yes"
          ? ` (${topic.employmentType ?? "employment"})`
          : topic.employment === "open"
            ? " (employment possible)"
            : "";
        results.push({
          id: topic.id,
          type: "topic",
          name: topic.title,
          title: (topic.type === "job" ? "Industry thesis" : "Academic thesis") + employmentTag,
          affiliation: ownerName || "Unknown",
          email: "",
          reason: request.reason,
          matchScore: Math.min(score, 1),
          fieldNames: resolveFieldNames(topic.fieldIds, fieldMap),
        });
      }
    }
  }

  // --- Universities ---
  if (searchAll || request.type === "university") {
    for (const uni of universities) {
      const text = textMatchScore(kw, uni.name, uni.about, ...uni.domains);
      if (text > 0) {
        results.push({
          id: uni.id,
          type: "university",
          name: uni.name,
          title: uni.country === "CH" ? "Swiss University" : "University",
          affiliation: uni.domains.join(", "),
          email: "",
          reason: request.reason,
          matchScore: Math.min(text, 1),
          fieldNames: [],
        });
      }
    }
  }

  // --- Study Programs ---
  if (searchAll || request.type === "program") {
    for (const prog of studyPrograms) {
      const uniName = uniMap.get(prog.universityId) ?? "";
      const text = textMatchScore(kw, prog.name, prog.about, uniName, prog.degree);
      if (text > 0) {
        results.push({
          id: prog.id,
          type: "program",
          name: prog.name,
          title: `${prog.degree.toUpperCase()} program`,
          affiliation: uniName || "University",
          email: "",
          reason: request.reason,
          matchScore: Math.min(text, 1),
          fieldNames: [],
        });
      }
    }
  }

  // Sort by score and return top results
  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxResults);
}

function resolveKeywordFields(keywords: string[], fields: Field[]): string[] {
  const matched: string[] = [];
  for (const field of fields) {
    const fieldLower = field.name.toLowerCase();
    for (const kw of keywords) {
      if (fieldLower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(fieldLower)) {
        matched.push(field.id);
        break;
      }
    }
  }
  return matched;
}

function textMatchScore(keywords: string[], ...texts: (string | null | undefined)[]): number {
  const combined = texts.filter(Boolean).join(" ").toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (combined.includes(kw)) hits++;
  }
  return keywords.length > 0 ? hits / keywords.length : 0;
}

function resolveFieldNames(fieldIds: string[], fieldMap: Map<string, Field>): string[] {
  return fieldIds.map((id) => fieldMap.get(id)?.name ?? id);
}
