import Anthropic from "@anthropic-ai/sdk";
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
import type {
  RecommendationRequest,
  Recommendation,
  RecommendationType,
} from "@/types/gps";
import type { Field } from "@/types";

const client = new Anthropic();

const RERANKER_MODEL = "claude-3-5-haiku-20241022";

interface CandidateDocument {
  id: string;
  type: RecommendationType;
  name: string;
  title: string;
  affiliation: string;
  email: string;
  fieldNames: string[];
  document: string;
  retrievalScore: number;
}

// ---------------------------------------------------------------------------
// Document builders
// ---------------------------------------------------------------------------

function buildSupervisorDoc(
  sup: { title: string; firstName: string; lastName: string; researchInterests: string[]; about: string | null; objectives: string[] },
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

function buildExpertDoc(
  exp: { firstName: string; lastName: string; title: string; about: string | null; offerInterviews: boolean; objectives: string[] },
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

function buildCompanyDoc(
  comp: { name: string; description: string; about: string | null; size: string; domains: string[] },
): string {
  const parts = [
    `${comp.name} (${comp.size} employees)`,
    `Domains: ${comp.domains.join(", ")}`,
    comp.description,
  ];
  if (comp.about) parts.push(`About: ${comp.about}`);
  return parts.join("\n");
}

function buildTopicDoc(
  topic: { title: string; description: string; type: string; employment: string; employmentType: string | null; degrees: string[] },
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

function buildUniversityDoc(
  uni: { name: string; country: string; domains: string[]; about: string | null },
): string {
  const parts = [
    `${uni.name} (${uni.country})`,
    `Domains: ${uni.domains.join(", ")}`,
  ];
  if (uni.about) parts.push(`About: ${uni.about}`);
  return parts.join("\n");
}

function buildProgramDoc(
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

// ---------------------------------------------------------------------------
// Text scoring — tokenised BM25 with domain boosting
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "this", "that", "these", "those",
  "it", "its", "we", "you", "they", "he", "she", "my", "your",
  "his", "her", "our", "their", "me", "us", "him", "them", "who",
  "which", "what", "where", "when", "how", "not", "no", "nor", "if",
  "then", "than", "so", "as", "up", "out", "about", "into", "over",
  "after", "before", "between", "under", "above", "such", "each",
  "every", "all", "any", "both", "few", "more", "most", "other",
  "some", "just", "also", "very", "well", "only", "find", "looking",
  "need", "want", "search", "companies", "company", "people",
]);

function tokeniseKeywords(keywords: string[]): string[] {
  const tokens = new Set<string>();
  for (const kw of keywords) {
    for (const word of kw.toLowerCase().split(/[\s,;/&+\-]+/)) {
      const w = word.replace(/[^a-z0-9]/g, "");
      if (w.length >= 2 && !STOP_WORDS.has(w)) tokens.add(w);
    }
    const full = kw.toLowerCase().trim();
    if (full.length >= 2) tokens.add(full);
  }
  return [...tokens];
}

function bm25Score(tokens: string[], document: string): number {
  const docLower = document.toLowerCase();
  const docWordCount = docLower.split(/\s+/).length;
  const AVG_DOC_LEN = 80;
  const k1 = 1.5;
  const b = 0.75;

  let total = 0;
  let matched = 0;
  for (const token of tokens) {
    let tf = 0;
    let start = 0;
    while (true) {
      const idx = docLower.indexOf(token, start);
      if (idx === -1) break;
      tf++;
      start = idx + token.length;
    }
    if (tf === 0) continue;
    matched++;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docWordCount / AVG_DOC_LEN));
    total += numerator / denominator;
  }
  if (matched === 0) return 0;
  const coverageBonus = matched / tokens.length;
  return (total / tokens.length) * (0.5 + 0.5 * coverageBonus);
}

function domainScore(domains: string[], tokens: string[], rawKeywords: string[]): number {
  let hits = 0;
  const allTerms = [...tokens, ...rawKeywords.map((k) => k.toLowerCase())];
  for (const domain of domains) {
    const dl = domain.toLowerCase();
    for (const term of allTerms) {
      if (dl.includes(term) || term.includes(dl)) {
        hits++;
        break;
      }
    }
  }
  return domains.length > 0 ? hits / domains.length : 0;
}

function aboutScore(about: string | null, tokens: string[]): number {
  if (!about) return 0;
  const text = about.toLowerCase();
  let matched = 0;
  for (const token of tokens) {
    if (text.includes(token)) matched++;
  }
  return tokens.length > 0 ? matched / tokens.length : 0;
}

// ---------------------------------------------------------------------------
// Step 1: Retrieval
// ---------------------------------------------------------------------------

function resolveFieldNames(fieldIds: string[], fieldMap: Map<string, Field>): string[] {
  return fieldIds.map((id) => fieldMap.get(id)?.name ?? id);
}

function resolveKeywordFields(keywords: string[], fields: Field[]): string[] {
  const tokens = tokeniseKeywords(keywords);
  const matched: string[] = [];
  for (const field of fields) {
    const fl = field.name.toLowerCase();
    for (const token of tokens) {
      if (fl.includes(token) || token.includes(fl)) {
        matched.push(field.id);
        break;
      }
    }
  }
  return matched;
}

async function retrieveCandidates(
  request: RecommendationRequest,
  projectId: string,
  maxCandidates = 15,
): Promise<CandidateDocument[]> {
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

  const student = project ? await getStudent(project.studentId) : null;
  const studentFieldIds = student?.fieldIds ?? [];
  const keywordFieldIds = resolveKeywordFields(request.keywords, fields);
  const searchFieldIds = [...new Set([...studentFieldIds, ...keywordFieldIds])];

  const tokens = tokeniseKeywords(request.keywords);
  const searchAll = request.type === "all";
  const candidates: CandidateDocument[] = [];

  if (searchAll || request.type === "supervisor") {
    for (const sup of supervisors) {
      const fNames = resolveFieldNames(sup.fieldIds, fieldMap);
      const doc = buildSupervisorDoc(sup, uniMap.get(sup.universityId) ?? "University", fNames);
      const fieldScore = computeMatch(searchFieldIds, sup.fieldIds).score;
      const textScore = bm25Score(tokens, doc);
      const aScore = aboutScore(sup.about, tokens);
      const score = fieldScore * 0.3 + textScore * 0.4 + aScore * 0.3;
      if (score > 0) {
        candidates.push({
          id: sup.id,
          type: "supervisor",
          name: `${sup.title} ${sup.firstName} ${sup.lastName}`,
          title: sup.researchInterests.slice(0, 3).join(", "),
          affiliation: uniMap.get(sup.universityId) ?? "University",
          email: sup.email,
          fieldNames: fNames,
          document: doc,
          retrievalScore: Math.min(score, 1),
        });
      }
    }
  }

  if (searchAll || request.type === "expert") {
    for (const exp of experts) {
      const companyName = companyMap.get(exp.companyId) ?? "";
      const fNames = resolveFieldNames(exp.fieldIds, fieldMap);
      const doc = buildExpertDoc(exp, companyName, fNames);
      const fieldScore = computeMatch(searchFieldIds, exp.fieldIds).score;
      const textScore = bm25Score(tokens, doc);
      const aScore = aboutScore(exp.about, tokens);
      const score = fieldScore * 0.3 + textScore * 0.4 + aScore * 0.3;
      if (score > 0) {
        candidates.push({
          id: exp.id,
          type: "expert",
          name: `${exp.firstName} ${exp.lastName}`,
          title: exp.title,
          affiliation: companyName || "Company",
          email: exp.email,
          fieldNames: fNames,
          document: doc,
          retrievalScore: Math.min(score, 1),
        });
      }
    }
  }

  if (searchAll || request.type === "company") {
    for (const comp of companies) {
      const doc = buildCompanyDoc(comp);
      const textScore = bm25Score(tokens, doc);
      const dScore = domainScore(comp.domains, tokens, request.keywords);
      const aScore = aboutScore(comp.about, tokens);
      const score = textScore * 0.35 + dScore * 0.3 + aScore * 0.35;
      if (score > 0) {
        candidates.push({
          id: comp.id,
          type: "company",
          name: comp.name,
          title: comp.domains.slice(0, 3).join(", "),
          affiliation: `${comp.size} employees`,
          email: "",
          fieldNames: comp.domains.slice(0, 3),
          document: doc,
          retrievalScore: Math.min(score, 1),
        });
      }
    }
  }

  if (searchAll || request.type === "topic") {
    for (const topic of topics) {
      const ownerName = topic.companyId
        ? companyMap.get(topic.companyId) ?? ""
        : uniMap.get(topic.universityId ?? "") ?? "";
      const fNames = resolveFieldNames(topic.fieldIds, fieldMap);
      const doc = buildTopicDoc(topic, ownerName, fNames);
      const fieldScore = computeMatch(searchFieldIds, topic.fieldIds).score;
      const textScore = bm25Score(tokens, doc);
      const score = fieldScore * 0.4 + textScore * 0.6;
      if (score > 0) {
        const employmentTag =
          topic.employment === "yes"
            ? ` (${topic.employmentType ?? "employment"})`
            : topic.employment === "open"
              ? " (employment possible)"
              : "";
        candidates.push({
          id: topic.id,
          type: "topic",
          name: topic.title,
          title: (topic.type === "job" ? "Industry thesis" : "Academic thesis") + employmentTag,
          affiliation: ownerName || "Unknown",
          email: "",
          fieldNames: fNames,
          document: doc,
          retrievalScore: Math.min(score, 1),
        });
      }
    }
  }

  if (searchAll || request.type === "university") {
    for (const uni of universities) {
      const doc = buildUniversityDoc(uni);
      const textScore = bm25Score(tokens, doc);
      const dScore = domainScore(uni.domains, tokens, request.keywords);
      const aScore = aboutScore(uni.about, tokens);
      const score = textScore * 0.35 + dScore * 0.3 + aScore * 0.35;
      if (score > 0) {
        candidates.push({
          id: uni.id,
          type: "university",
          name: uni.name,
          title: uni.country === "CH" ? "Swiss University" : "University",
          affiliation: uni.domains.join(", "),
          email: "",
          fieldNames: [],
          document: doc,
          retrievalScore: Math.min(score, 1),
        });
      }
    }
  }

  if (searchAll || request.type === "program") {
    for (const prog of studyPrograms) {
      const uniName = uniMap.get(prog.universityId) ?? "";
      const doc = buildProgramDoc(prog, uniName);
      const textScore = bm25Score(tokens, doc);
      const aScore = aboutScore(prog.about, tokens);
      const score = textScore * 0.6 + aScore * 0.4;
      if (score > 0) {
        candidates.push({
          id: prog.id,
          type: "program",
          name: prog.name,
          title: `${prog.degree.toUpperCase()} program`,
          affiliation: uniName || "University",
          email: "",
          fieldNames: [],
          document: doc,
          retrievalScore: Math.min(textScore, 1),
        });
      }
    }
  }

  return candidates
    .sort((a, b) => b.retrievalScore - a.retrievalScore)
    .slice(0, maxCandidates);
}

// ---------------------------------------------------------------------------
// Step 2: Reranking
// ---------------------------------------------------------------------------

interface RerankResult {
  index: number;
  score: number;
  reason: string;
}

async function rerankWithLLM(
  candidates: CandidateDocument[],
  request: RecommendationRequest,
): Promise<Recommendation[]> {
  const candidateList = candidates
    .map(
      (c, i) =>
        `[${i}] (${c.type})\n${c.document}`,
    )
    .join("\n\n---\n\n");

  const selfContainedQuery = `Looking for: ${request.type === "all" ? "any relevant entity" : request.type}. Reason: ${request.reason}. Domain keywords: ${request.keywords.join(", ")}.`;

  const response = await client.messages.create({
    model: RERANKER_MODEL,
    max_tokens: 1024,
    system: `You are a recommendation reranker for Studyond, a platform connecting students with thesis supervisors, experts, companies, and topics.

TASK: Given a search request and a list of candidates, select ONLY the ones that genuinely match.

RULES:
- Score each candidate 0-10 for relevance to the SPECIFIC search request
- Only include candidates scoring >= 7
- Write a concise reason (1 sentence) explaining WHY this candidate is a good match
- If NO candidates truly fit, return an empty array — that is perfectly fine
- Quality over quantity: 1-2 excellent matches beat 5 mediocre ones
- Read each candidate's full profile carefully, especially their "About" section

Respond with ONLY a JSON array (no markdown fences):
[{"index": 0, "score": 9, "reason": "..."}, ...]`,
    messages: [
      {
        role: "user",
        content: `${selfContainedQuery}

CANDIDATES:

${candidateList}`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  let ranked: RerankResult[];
  try {
    ranked = JSON.parse(cleaned);
  } catch {
    return fallbackToRetrieval(candidates);
  }

  if (!Array.isArray(ranked)) {
    return fallbackToRetrieval(candidates);
  }

  return ranked
    .filter((r) => r.score >= 7 && r.index >= 0 && r.index < candidates.length)
    .sort((a, b) => b.score - a.score)
    .map((r) => {
      const c = candidates[r.index];
      return {
        id: c.id,
        type: c.type,
        name: c.name,
        title: c.title,
        affiliation: c.affiliation,
        email: c.email,
        reason: r.reason,
        matchScore: r.score / 10,
        fieldNames: c.fieldNames,
      };
    });
}

function fallbackToRetrieval(candidates: CandidateDocument[]): Recommendation[] {
  return candidates.slice(0, 3).map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    title: c.title,
    affiliation: c.affiliation,
    email: c.email,
    reason: "Matched by keyword relevance.",
    matchScore: c.retrievalScore,
    fieldNames: c.fieldNames,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * RAG-powered recommendation search.
 *
 * 1. Retrieval  — BM25 + field overlap scores a broad pool of candidates.
 * 2. Reranking  — Claude reads every candidate's full profile, filters out
 *                 weak matches, and writes a personalised reason for each.
 *
 * Returns only genuinely relevant results (often fewer than 5).
 */
export async function ragSearch(
  request: RecommendationRequest,
  projectId: string,
): Promise<Recommendation[]> {
  const candidates = await retrieveCandidates(request, projectId);
  if (candidates.length === 0) return [];

  try {
    return await rerankWithLLM(candidates, request);
  } catch (err) {
    console.error("RAG reranker failed, falling back to retrieval:", err);
    return fallbackToRetrieval(candidates);
  }
}
