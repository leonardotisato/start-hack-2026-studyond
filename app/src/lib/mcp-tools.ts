import Anthropic from "@anthropic-ai/sdk";
import {
  getSupervisors,
  getExperts,
  getCompanies,
  getFields,
  getUniversities,
  getStudyPrograms,
  getTopics,
  getSupervisor,
  getExpert,
  getCompany,
  getTopic,
  getUniversity,
  getStudyProgram,
} from "@/lib/data";
import {
  resolveFieldNames,
  buildSupervisorDoc,
  buildExpertDoc,
  buildCompanyDoc,
  buildTopicDoc,
  buildUniversityDoc,
  buildProgramDoc,
} from "@/lib/entity-docs";
import type { Recommendation, RecommendationType } from "@/types/gps";

// ---------------------------------------------------------------------------
// Tool definitions (Anthropic SDK format)
// ---------------------------------------------------------------------------

export const SEARCH_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_database",
    description:
      "Search the Studyond database for supervisors, experts, companies, thesis topics, universities, and study programs. Returns entity profiles matching your query. Use this whenever the student asks to find people, organizations, or thesis opportunities.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Natural language description of what to find",
        },
        entity_types: {
          type: "array",
          items: { type: "string" },
          description:
            'Filter to specific types: "supervisor", "expert", "company", "topic", "university", "program". Omit to search all.',
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_entity_details",
    description:
      "Get the full profile of a specific entity by its ID. Use this to get complete details about a supervisor, expert, company, topic, university, or program.",
    input_schema: {
      type: "object" as const,
      properties: {
        entity_type: {
          type: "string",
          enum: [
            "supervisor",
            "expert",
            "company",
            "topic",
            "university",
            "program",
          ],
          description: "The type of entity to retrieve",
        },
        entity_id: {
          type: "string",
          description: "The entity ID",
        },
      },
      required: ["entity_type", "entity_id"],
    },
  },
  {
    name: "select_recommendations",
    description:
      "After reviewing search results, call this tool to recommend the TOP 2-3 entities that CLOSELY match the student's request. Only include entities that are genuinely relevant — if none truly fit, call this with an empty array. Quality over quantity.",
    input_schema: {
      type: "object" as const,
      properties: {
        picks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              entity_id: {
                type: "string",
                description: "The entity ID from search results",
              },
              entity_type: {
                type: "string",
                enum: [
                  "supervisor",
                  "expert",
                  "company",
                  "topic",
                  "university",
                  "program",
                ],
              },
              reason: {
                type: "string",
                description:
                  "1-sentence explanation of why this entity is a strong match",
              },
            },
            required: ["entity_id", "entity_type", "reason"],
          },
          description:
            "Top 2-3 most relevant entities. Empty array if none closely match.",
        },
      },
      required: ["picks"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

const ALL_TYPES: RecommendationType[] = [
  "supervisor",
  "expert",
  "company",
  "topic",
  "university",
  "program",
];

interface SearchResult {
  id: string;
  type: RecommendationType;
  name: string;
  title: string;
  affiliation: string;
  email: string;
  fieldNames: string[];
  document: string;
}

async function executeSearchDatabase(input: {
  query: string;
  entity_types?: string[];
}): Promise<{ text: string; results: SearchResult[] }> {
  const types = (
    input.entity_types?.length ? input.entity_types : ALL_TYPES
  ) as RecommendationType[];

  const [
    fields,
    universities,
    companies,
    studyPrograms,
    supervisors,
    experts,
    topics,
  ] = await Promise.all([
    getFields(),
    getUniversities(),
    getCompanies(),
    getStudyPrograms(),
    getSupervisors(),
    getExperts(),
    getTopics(),
  ]);

  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const uniMap = new Map(universities.map((u) => [u.id, u.name]));
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const results: SearchResult[] = [];

  if (types.includes("supervisor")) {
    for (const sup of supervisors) {
      const fNames = resolveFieldNames(sup.fieldIds, fieldMap);
      results.push({
        id: sup.id,
        type: "supervisor",
        name: `${sup.title} ${sup.firstName} ${sup.lastName}`,
        title: sup.researchInterests.slice(0, 3).join(", "),
        affiliation: uniMap.get(sup.universityId) ?? "University",
        email: sup.email,
        fieldNames: fNames,
        document: buildSupervisorDoc(
          sup,
          uniMap.get(sup.universityId) ?? "University",
          fNames,
        ),
      });
    }
  }

  if (types.includes("expert")) {
    for (const exp of experts) {
      const companyName = companyMap.get(exp.companyId) ?? "";
      const fNames = resolveFieldNames(exp.fieldIds, fieldMap);
      results.push({
        id: exp.id,
        type: "expert",
        name: `${exp.firstName} ${exp.lastName}`,
        title: exp.title,
        affiliation: companyName || "Company",
        email: exp.email,
        fieldNames: fNames,
        document: buildExpertDoc(exp, companyName, fNames),
      });
    }
  }

  if (types.includes("company")) {
    for (const comp of companies) {
      results.push({
        id: comp.id,
        type: "company",
        name: comp.name,
        title: comp.domains.slice(0, 3).join(", "),
        affiliation: `${comp.size} employees`,
        email: "",
        fieldNames: comp.domains.slice(0, 3),
        document: buildCompanyDoc(comp),
      });
    }
  }

  if (types.includes("topic")) {
    for (const topic of topics) {
      const ownerName = topic.companyId
        ? (companyMap.get(topic.companyId) ?? "")
        : (uniMap.get(topic.universityId ?? "") ?? "");
      const fNames = resolveFieldNames(topic.fieldIds, fieldMap);
      const employmentTag =
        topic.employment === "yes"
          ? ` (${topic.employmentType ?? "employment"})`
          : topic.employment === "open"
            ? " (employment possible)"
            : "";
      results.push({
        id: topic.id,
        type: "topic",
        name: topic.title,
        title:
          (topic.type === "job" ? "Industry thesis" : "Academic thesis") +
          employmentTag,
        affiliation: ownerName || "Unknown",
        email: "",
        fieldNames: fNames,
        document: buildTopicDoc(topic, ownerName, fNames),
      });
    }
  }

  if (types.includes("university")) {
    for (const uni of universities) {
      results.push({
        id: uni.id,
        type: "university",
        name: uni.name,
        title: uni.country === "CH" ? "Swiss University" : "University",
        affiliation: uni.domains.join(", "),
        email: "",
        fieldNames: [],
        document: buildUniversityDoc(uni),
      });
    }
  }

  if (types.includes("program")) {
    for (const prog of studyPrograms) {
      const uniName = uniMap.get(prog.universityId) ?? "";
      results.push({
        id: prog.id,
        type: "program",
        name: prog.name,
        title: `${prog.degree.toUpperCase()} program`,
        affiliation: uniName || "University",
        email: "",
        fieldNames: [],
        document: buildProgramDoc(prog, uniName),
      });
    }
  }

  const lines = results.map((r) => `[${r.type}] id=${r.id}\n${r.document}`);

  return {
    text: `Found ${results.length} entities.\n\n${lines.join("\n\n---\n\n")}`,
    results,
  };
}

async function executeGetEntityDetails(input: {
  entity_type: string;
  entity_id: string;
}): Promise<string> {
  const { entity_type, entity_id } = input;

  const [fields, universities, companies] = await Promise.all([
    getFields(),
    getUniversities(),
    getCompanies(),
  ]);

  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const uniMap = new Map(universities.map((u) => [u.id, u.name]));
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  switch (entity_type) {
    case "supervisor": {
      const sup = await getSupervisor(entity_id);
      if (!sup) return `Supervisor ${entity_id} not found.`;
      const fNames = resolveFieldNames(sup.fieldIds, fieldMap);
      return `${buildSupervisorDoc(sup, uniMap.get(sup.universityId) ?? "University", fNames)}\nEmail: ${sup.email}`;
    }
    case "expert": {
      const exp = await getExpert(entity_id);
      if (!exp) return `Expert ${entity_id} not found.`;
      const fNames = resolveFieldNames(exp.fieldIds, fieldMap);
      return `${buildExpertDoc(exp, companyMap.get(exp.companyId) ?? "Company", fNames)}\nEmail: ${exp.email}`;
    }
    case "company": {
      const comp = await getCompany(entity_id);
      if (!comp) return `Company ${entity_id} not found.`;
      return buildCompanyDoc(comp);
    }
    case "topic": {
      const topic = await getTopic(entity_id);
      if (!topic) return `Topic ${entity_id} not found.`;
      const ownerName = topic.companyId
        ? (companyMap.get(topic.companyId) ?? "")
        : (uniMap.get(topic.universityId ?? "") ?? "");
      const fNames = resolveFieldNames(topic.fieldIds, fieldMap);
      return buildTopicDoc(topic, ownerName, fNames);
    }
    case "university": {
      const uni = await getUniversity(entity_id);
      if (!uni) return `University ${entity_id} not found.`;
      return buildUniversityDoc(uni);
    }
    case "program": {
      const prog = await getStudyProgram(entity_id);
      if (!prog) return `Program ${entity_id} not found.`;
      return buildProgramDoc(
        prog,
        uniMap.get(prog.universityId) ?? "University",
      );
    }
    default:
      return `Unknown entity type: ${entity_type}`;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RecommendationPick {
  entity_id: string;
  entity_type: string;
  reason: string;
}

export interface ToolSession {
  executeToolCall: (
    name: string,
    input: Record<string, unknown>,
  ) => Promise<string>;
  getLastSearchResults: () => SearchResult[];
  getSelectedPicks: () => RecommendationPick[];
}

export function createToolSession(): ToolSession {
  let lastSearchResults: SearchResult[] = [];
  let selectedPicks: RecommendationPick[] = [];

  return {
    async executeToolCall(
      name: string,
      input: Record<string, unknown>,
    ): Promise<string> {
      switch (name) {
        case "search_database": {
          const { text, results } = await executeSearchDatabase(
            input as { query: string; entity_types?: string[] },
          );
          lastSearchResults = results;
          return text;
        }
        case "get_entity_details":
          return executeGetEntityDetails(
            input as { entity_type: string; entity_id: string },
          );
        case "select_recommendations": {
          const picks = (input as { picks: RecommendationPick[] }).picks ?? [];
          selectedPicks = picks;
          if (picks.length === 0) {
            return "No recommendations selected — none closely matched the request.";
          }
          return `Selected ${picks.length} recommendation(s). They will be shown to the student.`;
        }
        default:
          return `Unknown tool: ${name}`;
      }
    },
    getLastSearchResults() {
      return lastSearchResults;
    },
    getSelectedPicks() {
      return selectedPicks;
    },
  };
}

export function picksToRecommendations(
  picks: RecommendationPick[],
  searchResults: SearchResult[],
): Recommendation[] {
  const resultMap = new Map(searchResults.map((r) => [`${r.type}:${r.id}`, r]));

  return picks
    .map((pick) => {
      const r = resultMap.get(`${pick.entity_type}:${pick.entity_id}`);
      if (!r) return null;
      return {
        id: r.id,
        type: r.type,
        name: r.name,
        title: r.title,
        affiliation: r.affiliation,
        email: r.email,
        reason: pick.reason,
        matchScore: 1,
        fieldNames: r.fieldNames,
      };
    })
    .filter((r): r is Recommendation => r !== null);
}
