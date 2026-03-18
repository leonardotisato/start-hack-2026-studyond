import type { DiagnosisInput, DiagnosisResult } from "@/lib/contracts/diagnosis";

export const diagnosisInputFixture: DiagnosisInput = {
  studentId: "student-07",
  universityId: "university-03",
  studyProgramId: "study-program-08",
  degree: "msc",
  currentStage: "orientation",
  topicStatus: "browsing",
  interests: ["sustainability", "supply chain", "data analysis"],
  blockers: [
    "I do not know how to narrow down a thesis question",
    "I am not sure which professor to contact first",
  ],
  skillGaps: ["academic writing", "research design"],
  confidence: 2,
  deadlineWeeks: 16,
  expectationsClear: false,
  hasSupervisorInMind: false,
  notes:
    "I want a thesis with company relevance, but I am afraid of choosing something too broad.",
};

export const diagnosisResultFixture: DiagnosisResult = {
  stage: "orientation",
  clarityLevel: "medium",
  readinessScore: 58,
  diagnosisSummary:
    "You are early in the thesis journey: motivated, commercially oriented, and interested in real-world topics, but still missing scope clarity and a first supervisor strategy.",
  chatSummary:
    "The student wants a company-connected thesis in sustainability and supply chain, but feels unsure about what a feasible research question looks like.",
  strengths: [
    "Strong field interest with a clear business angle",
    "Healthy time buffer before the thesis deadline",
    "Motivation to work on real-world problems",
  ],
  gaps: [
    "No shortlist of thesis directions yet",
    "No first supervisor outreach plan",
    "Low confidence on academic writing and methodology",
  ],
  roadmap: [
    {
      id: "orientation-map",
      title: "Clarify thesis direction",
      stage: "orientation",
      status: "current",
      description:
        "Reduce the possibility space to two or three thesis directions that feel feasible.",
      whyItMatters:
        "Without a narrower direction, every next step stays vague and overwhelming.",
      blockedBy: [],
      suggestedWeek: 1,
    },
    {
      id: "topic-search-map",
      title: "Shortlist topics and supervisors",
      stage: "topic_and_supervisor_search",
      status: "next",
      description:
        "Match the student with topics and professors who fit the desired direction.",
      whyItMatters:
        "A shortlist makes the outreach phase concrete and lowers the activation energy.",
      blockedBy: [],
      suggestedWeek: 2,
    },
    {
      id: "planning-map",
      title: "Validate scope and method",
      stage: "planning",
      status: "blocked",
      description:
        "Confirm the thesis is academically viable and specific enough to execute.",
      whyItMatters:
        "This is where many students discover that a topic sounded good but was not practical.",
      blockedBy: ["No supervisor conversation yet"],
      suggestedWeek: 4,
    },
  ],
  directions: [
    {
      id: "direction-1",
      kind: "direction",
      title: "Sustainable logistics with measurable operational data",
      rationale:
        "This matches your supply-chain interest while staying concrete enough for a master's thesis.",
      ctaLabel: "Explore related topics",
      ctaHref: "/diagnosis",
      tags: ["sustainability", "operations", "data"],
    },
    {
      id: "direction-2",
      kind: "direction",
      title: "Industry thesis with a company-backed case study",
      rationale:
        "A company context can give you clearer constraints and reduce early-stage ambiguity.",
      ctaLabel: "View company-backed paths",
      ctaHref: "/diagnosis",
      tags: ["company", "case study", "applied"],
    },
  ],
  nextActions: [
    {
      id: "action-1",
      kind: "action",
      title: "Narrow to three candidate thesis questions",
      rationale:
        "The next bottleneck is not more browsing, but turning your broad interest into concrete options.",
      ctaLabel: "Start narrowing",
      ctaHref: "/diagnosis",
      tags: ["scope", "clarity"],
    },
    {
      id: "action-2",
      kind: "person",
      title: "Prepare first supervisor outreach",
      rationale:
        "A short and well-structured first message will quickly reveal whether your direction is viable.",
      ctaLabel: "Draft outreach",
      ctaHref: "/diagnosis",
      tags: ["supervisor", "outreach"],
    },
    {
      id: "action-3",
      kind: "resource",
      title: "Review methodology basics before locking a topic",
      rationale:
        "Early familiarity with methods will help you avoid picking a topic that you cannot execute well.",
      ctaLabel: "Open learning path",
      ctaHref: null,
      tags: ["methodology", "readiness"],
    },
  ],
  confidenceNote:
    "Low confidence at this stage is normal. Your next goal is not to know everything, but to make the thesis legible enough to take the first concrete step.",
};
