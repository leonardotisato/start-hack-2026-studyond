import {
  getSupervisors,
  getExperts,
  getCompanies,
  getFields,
  getUniversities,
  getTopics,
  getStudent,
  getProject,
} from "@/lib/data";
import { computeMatch } from "@/lib/matching";
import type { RecommendationRequest, Recommendation, RecommendationType } from "@/types/gps";
import type { Field } from "@/types";

/**
 * Sub-agent: search mock data for people/entities matching the user's need.
 * Uses field-based matching + keyword search on research interests, about, skills.
 */
export async function findRecommendations(
  request: RecommendationRequest,
  projectId: string,
  maxResults = 3
): Promise<Recommendation[]> {
  const [fields, universities, companies, project] = await Promise.all([
    getFields(),
    getUniversities(),
    getCompanies(),
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
  // Combine student fields + keyword-matched fields for scoring
  const searchFieldIds = [...new Set([...studentFieldIds, ...keywordFieldIds])];

  const lowerKeywords = request.keywords.map((k) => k.toLowerCase());

  switch (request.type) {
    case "supervisor":
      return searchSupervisors(searchFieldIds, lowerKeywords, fieldMap, uniMap, request.reason, maxResults);
    case "expert":
      return searchExperts(searchFieldIds, lowerKeywords, fieldMap, companyMap, request.reason, maxResults);
    case "company":
      return searchCompanies(lowerKeywords, companyMap, request.reason, maxResults);
    case "topic":
      return searchTopics(searchFieldIds, lowerKeywords, fieldMap, uniMap, companyMap, request.reason, maxResults);
    default:
      // Search both supervisors and experts, return best mix
      const [sups, exps] = await Promise.all([
        searchSupervisors(searchFieldIds, lowerKeywords, fieldMap, uniMap, request.reason, maxResults),
        searchExperts(searchFieldIds, lowerKeywords, fieldMap, companyMap, request.reason, maxResults),
      ]);
      return [...sups, ...exps]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxResults);
  }
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

async function searchSupervisors(
  searchFieldIds: string[],
  keywords: string[],
  fieldMap: Map<string, Field>,
  uniMap: Map<string, string>,
  reason: string,
  max: number
): Promise<Recommendation[]> {
  const supervisors = await getSupervisors();

  return supervisors
    .map((sup) => {
      const fieldMatch = computeMatch(searchFieldIds, sup.fieldIds);
      const textScore = textMatchScore(
        keywords,
        ...sup.researchInterests,
        sup.about,
        sup.firstName + " " + sup.lastName
      );
      const score = fieldMatch.score * 0.6 + textScore * 0.4;
      return { sup, score, fieldMatch };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ sup, score }) => ({
      id: sup.id,
      type: "supervisor" as RecommendationType,
      name: `${sup.title} ${sup.firstName} ${sup.lastName}`,
      title: sup.researchInterests.slice(0, 3).join(", "),
      affiliation: uniMap.get(sup.universityId) ?? "University",
      email: sup.email,
      reason,
      matchScore: Math.min(score, 1),
      fieldNames: resolveFieldNames(sup.fieldIds, fieldMap),
    }));
}

async function searchExperts(
  searchFieldIds: string[],
  keywords: string[],
  fieldMap: Map<string, Field>,
  companyMap: Map<string, string>,
  reason: string,
  max: number
): Promise<Recommendation[]> {
  const experts = await getExperts();

  return experts
    .map((exp) => {
      const fieldMatch = computeMatch(searchFieldIds, exp.fieldIds);
      const textScore = textMatchScore(
        keywords,
        exp.title,
        exp.about,
        exp.firstName + " " + exp.lastName
      );
      const score = fieldMatch.score * 0.6 + textScore * 0.4;
      return { exp, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ exp, score }) => ({
      id: exp.id,
      type: "expert" as RecommendationType,
      name: `${exp.firstName} ${exp.lastName}`,
      title: exp.title,
      affiliation: companyMap.get(exp.companyId) ?? "Company",
      email: exp.email,
      reason,
      matchScore: Math.min(score, 1),
      fieldNames: resolveFieldNames(exp.fieldIds, fieldMap),
    }));
}

async function searchCompanies(
  keywords: string[],
  companyMap: Map<string, string>,
  reason: string,
  max: number
): Promise<Recommendation[]> {
  const companies = await getCompanies();

  return companies
    .map((comp) => {
      const textScore = textMatchScore(
        keywords,
        comp.name,
        comp.description,
        comp.about,
        ...comp.domains
      );
      return { comp, score: textScore };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ comp, score }) => ({
      id: comp.id,
      type: "company" as RecommendationType,
      name: comp.name,
      title: comp.domains.slice(0, 3).join(", "),
      affiliation: `${comp.size} employees`,
      email: "",
      reason,
      matchScore: Math.min(score, 1),
      fieldNames: comp.domains.slice(0, 3),
    }));
}

async function searchTopics(
  searchFieldIds: string[],
  keywords: string[],
  fieldMap: Map<string, Field>,
  uniMap: Map<string, string>,
  companyMap: Map<string, string>,
  reason: string,
  max: number
): Promise<Recommendation[]> {
  const topics = await getTopics();

  return topics
    .map((topic) => {
      const fieldMatch = computeMatch(searchFieldIds, topic.fieldIds);
      const textScore = textMatchScore(keywords, topic.title, topic.description);
      const score = fieldMatch.score * 0.6 + textScore * 0.4;
      return { topic, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ topic, score }) => ({
      id: topic.id,
      type: "topic" as RecommendationType,
      name: topic.title,
      title: topic.type === "job" ? "Industry thesis" : "Academic thesis",
      affiliation: topic.companyId
        ? (companyMap.get(topic.companyId) ?? "Company")
        : (uniMap.get(topic.universityId ?? "") ?? "University"),
      email: "",
      reason,
      matchScore: Math.min(score, 1),
      fieldNames: resolveFieldNames(topic.fieldIds, fieldMap),
    }));
}
