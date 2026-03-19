import type {
  DiagnosisInput,
  RecommendationCard,
  ThesisStage,
} from "../../src/lib/contracts/diagnosis";

import {
  getCompanies,
  getFields,
  getSupervisors,
  getTopics,
  getUniversities,
} from "../repositories/mock-data-repository";

function scoreTopicRelevance(
  topicFieldIds: string[],
  interestFieldIds: string[],
  degree: string | undefined,
  topicDegrees: string[],
): number {
  let score = 0;
  for (const fieldId of topicFieldIds) {
    if (interestFieldIds.includes(fieldId)) score += 10;
  }
  if (degree && topicDegrees.includes(degree)) score += 5;
  return score;
}

async function resolveInterestFieldIds(interests: string[]): Promise<string[]> {
  const fields = await getFields();
  const lowerInterests = interests.map((i) => i.toLowerCase());
  return fields
    .filter((f) =>
      lowerInterests.some(
        (interest) =>
          f.name.toLowerCase().includes(interest) ||
          interest.includes(f.name.toLowerCase()),
      ),
    )
    .map((f) => f.id);
}

export async function buildDirectionRecommendations(
  input: DiagnosisInput,
): Promise<RecommendationCard[]> {
  const [topics, universities, companies, fields] = await Promise.all([
    getTopics(),
    getUniversities(),
    getCompanies(),
    getFields(),
  ]);

  const interestFieldIds = await resolveInterestFieldIds(input.interests);

  const scored = topics.map((topic) => ({
    topic,
    score: scoreTopicRelevance(
      topic.fieldIds,
      interestFieldIds,
      input.degree ?? undefined,
      topic.degrees,
    ),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 3).filter((s) => s.score > 0);

  if (topMatches.length === 0) {
    return scored.slice(0, 2).map((s, index) => mapTopicToCard(s.topic, index, companies, fields));
  }

  return topMatches.map((s, index) => mapTopicToCard(s.topic, index, companies, fields));
}

function mapTopicToCard(
  topic: { id: string; title: string; description: string; companyId: string | null; fieldIds: string[] },
  index: number,
  companies: { id: string; name: string }[],
  fields: { id: string; name: string }[],
): RecommendationCard {
  const company = topic.companyId
    ? companies.find((c) => c.id === topic.companyId)
    : null;

  const fieldNames = topic.fieldIds
    .map((fid) => fields.find((f) => f.id === fid)?.name)
    .filter(Boolean) as string[];

  return {
    id: `direction-${index + 1}`,
    kind: "direction",
    title: topic.title,
    rationale: company
      ? `A thesis direction at ${company.name} that aligns with your interests. ${topic.description.slice(0, 120)}...`
      : `An academic thesis direction that fits your profile. ${topic.description.slice(0, 120)}...`,
    ctaLabel: "Explore this direction",
    ctaHref: `/topics/${topic.id}`,
    tags: fieldNames.slice(0, 3),
  };
}

export async function buildSupervisorRecommendations(
  input: DiagnosisInput,
): Promise<RecommendationCard[]> {
  const [supervisors, universities, fields] = await Promise.all([
    getSupervisors(),
    getUniversities(),
    getFields(),
  ]);

  const interestFieldIds = await resolveInterestFieldIds(input.interests);

  const scored = supervisors.map((sup) => {
    let score = 0;
    for (const fid of sup.fieldIds) {
      if (interestFieldIds.includes(fid)) score += 10;
    }
    if (input.universityId && sup.universityId === input.universityId) score += 5;
    if (sup.objectives.includes("student_matching")) score += 3;
    return { sup, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 2).filter((s) => s.score > 0);

  if (topMatches.length === 0) return [];

  return topMatches.map((s, index) => {
    const university = universities.find((u) => u.id === s.sup.universityId);
    return {
      id: `supervisor-rec-${index + 1}`,
      kind: "person" as const,
      title: `${s.sup.title} ${s.sup.firstName} ${s.sup.lastName}`,
      rationale: university
        ? `Supervisor at ${university.name} with research interests in ${s.sup.researchInterests.slice(0, 3).join(", ")}.`
        : `Researcher with interests in ${s.sup.researchInterests.slice(0, 3).join(", ")}.`,
      ctaLabel: "View profile",
      ctaHref: null,
      tags: s.sup.researchInterests.slice(0, 3),
    };
  });
}

const stageActions: Record<ThesisStage, RecommendationCard[]> = {
  orientation: [
    {
      id: "action-orient-1",
      kind: "action",
      title: "Narrow to three candidate thesis questions",
      rationale:
        "The next bottleneck is not more browsing, but turning your broad interest into concrete options.",
      ctaLabel: "Start narrowing",
      ctaHref: "/diagnosis",
      tags: ["scope", "clarity"],
    },
    {
      id: "action-orient-2",
      kind: "resource",
      title: "Review methodology basics before locking a topic",
      rationale:
        "Early familiarity with methods helps you avoid picking a topic that you cannot execute well.",
      ctaLabel: "Open learning path",
      ctaHref: null,
      tags: ["methodology", "readiness"],
    },
  ],
  topic_and_supervisor_search: [
    {
      id: "action-topic-1",
      kind: "action",
      title: "Draft a one-page thesis proposal for your top choice",
      rationale:
        "A short proposal forces you to articulate the research question and method concretely.",
      ctaLabel: "Start drafting",
      ctaHref: null,
      tags: ["proposal", "writing"],
    },
    {
      id: "action-topic-2",
      kind: "action",
      title: "Prepare first supervisor outreach",
      rationale:
        "A short and well-structured first message will quickly reveal whether your direction is viable.",
      ctaLabel: "Draft outreach",
      ctaHref: null,
      tags: ["supervisor", "outreach"],
    },
  ],
  planning: [
    {
      id: "action-plan-1",
      kind: "action",
      title: "Create a week-by-week thesis timeline",
      rationale:
        "A timeline turns an abstract plan into concrete milestones you can track and adjust.",
      ctaLabel: "Build timeline",
      ctaHref: null,
      tags: ["planning", "timeline"],
    },
  ],
  execution: [
    {
      id: "action-exec-1",
      kind: "action",
      title: "Set up a weekly check-in rhythm with your supervisor",
      rationale:
        "Regular feedback prevents you from drifting off course during the longest phase of the thesis.",
      ctaLabel: "Schedule check-ins",
      ctaHref: null,
      tags: ["supervision", "feedback"],
    },
  ],
  writing_and_finalization: [
    {
      id: "action-write-1",
      kind: "action",
      title: "Write the introduction and conclusion first",
      rationale:
        "These frame your argument and help you see whether your story holds together before filling in details.",
      ctaLabel: "Start writing",
      ctaHref: null,
      tags: ["writing", "structure"],
    },
  ],
};

export function getStageActions(stage: ThesisStage): RecommendationCard[] {
  return stageActions[stage] ?? stageActions.orientation;
}
