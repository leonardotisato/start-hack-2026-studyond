import type {
  DiagnosisInput,
  DiagnosisResult,
  ThesisStage,
} from "@/lib/contracts/diagnosis";

export type ResultsViewModel = {
  headline: string;
  summary: string;
  currentFocusTitle: string;
  currentFocusWhy: string;
  stageLabel: string;
  clarityLabel: string;
  readinessLabel: string;
  roadmapCount: number;
  actionCount: number;
  directionCount: number;
  blockedCount: number;
  quickStats: Array<{ label: string; value: string }>;
};

const thesisStageOrder: ThesisStage[] = [
  "orientation",
  "topic_and_supervisor_search",
  "planning",
  "execution",
  "writing_and_finalization",
];

function formatStageLabel(stage: ThesisStage) {
  return stage.replaceAll("_", " ");
}

function createClarityLabel(score: DiagnosisResult["clarityLevel"]) {
  if (score === "high") {
    return "Clear thesis direction";
  }

  if (score === "medium") {
    return "Direction is forming";
  }

  return "Still needs clarification";
}

function createReadinessLabel(score: number) {
  if (score >= 75) {
    return "Ready to start acting";
  }

  if (score >= 55) {
    return "Gaining structure";
  }

  return "Needs direction first";
}

export function createResultsViewModel(
  result: DiagnosisResult,
): ResultsViewModel {
  const currentFocus =
    result.roadmap.find((node) => node.status === "current") ?? result.roadmap[0];
  const blockedCount = result.roadmap.filter(
    (node) => node.status === "blocked",
  ).length;
  const stageLabel = formatStageLabel(result.stage);
  const clarityLabel = createClarityLabel(result.clarityLevel);
  const readinessLabel = createReadinessLabel(result.readinessScore);

  return {
    headline: `You are currently in ${stageLabel}.`,
    summary: result.diagnosisSummary,
    currentFocusTitle: currentFocus?.title ?? "Clarify your next step",
    currentFocusWhy:
      currentFocus?.whyItMatters ??
      "A clear current focus turns thesis anxiety into motion.",
    stageLabel,
    clarityLabel,
    readinessLabel,
    roadmapCount: result.roadmap.length,
    actionCount: result.nextActions.length,
    directionCount: result.directions.length,
    blockedCount,
    quickStats: [
      { label: "Stage", value: stageLabel },
      { label: "Clarity", value: clarityLabel },
      { label: "Next actions", value: String(result.nextActions.length) },
      { label: "Blocked nodes", value: String(blockedCount) },
    ],
  };
}

function computeReadinessScore(input: DiagnosisInput) {
  return Math.max(
    35,
    Math.min(
      92,
      72 -
        input.skillGaps.length * 8 -
        input.blockers.length * 5 +
        (input.expectationsClear ? 7 : 0) +
        (input.hasSupervisorInMind ? 6 : 0) +
        (input.topicStatus === "shortlisted" ? 5 : 0) +
        (input.topicStatus === "chosen" ? 10 : 0) +
        input.confidence * 3,
    ),
  );
}

function computeClarityLevel(
  input: DiagnosisInput,
): DiagnosisResult["clarityLevel"] {
  if (
    input.confidence >= 4 &&
    input.interests.length >= 2 &&
    input.topicStatus !== "none"
  ) {
    return "high";
  }

  if (input.interests.length > 0 || input.topicStatus !== "none") {
    return "medium";
  }

  return "low";
}

export function createDiagnosisPreviewResult(
  input: DiagnosisInput,
  fallback: DiagnosisResult,
): DiagnosisResult {
  const readinessScore = computeReadinessScore(input);
  const currentStageIndex = thesisStageOrder.indexOf(input.currentStage);
  const normalizedCurrentIndex = Math.min(
    Math.max(currentStageIndex, 0),
    Math.max(fallback.roadmap.length - 1, 0),
  );
  const currentInterests =
    input.interests.length > 0
      ? input.interests.join(", ")
      : "broad exploratory topics";
  const topBlockers =
    input.blockers.length > 0
      ? input.blockers
      : ["No clear next step captured yet"];
  const skillGaps =
    input.skillGaps.length > 0 ? input.skillGaps : fallback.gaps.slice(0, 2);

  return {
    ...fallback,
    stage: input.currentStage,
    clarityLevel: computeClarityLevel(input),
    readinessScore,
    diagnosisSummary: `You are in ${formatStageLabel(
      input.currentStage,
    )}, interested in ${currentInterests}, and the main work now is converting that interest into a feasible first thesis route.`,
    chatSummary: input.notes || fallback.chatSummary,
    gaps: skillGaps,
    confidenceNote:
      input.confidence >= 4
        ? "You already have enough confidence to take concrete action. The goal now is narrowing, not overthinking."
        : "Your uncertainty is normal at the start. Use the next actions below to turn confusion into momentum.",
    roadmap: fallback.roadmap.map((node, index) => {
      const nodeStageIndex = thesisStageOrder.indexOf(node.stage);

      return {
        ...node,
        status:
          nodeStageIndex < normalizedCurrentIndex
            ? "done"
            : nodeStageIndex === normalizedCurrentIndex && index === normalizedCurrentIndex
              ? "current"
              : nodeStageIndex === normalizedCurrentIndex &&
                  index !== normalizedCurrentIndex
                ? "next"
                : index === normalizedCurrentIndex + 1
                  ? "next"
                  : node.blockedBy.length > 0
                    ? "blocked"
                    : "next",
        blockedBy:
          node.status === "blocked" || node.blockedBy.length > 0
            ? topBlockers.slice(0, 2)
            : node.blockedBy,
      };
    }),
    directions: fallback.directions.map((direction, index) => ({
      ...direction,
      title:
        input.interests[index] != null
          ? `${direction.title} around ${input.interests[index]}`
          : direction.title,
      tags: input.interests.length > 0 ? input.interests.slice(0, 3) : direction.tags,
    })),
    nextActions: [
      {
        id: "preview-action-1",
        kind: "action",
        title:
          input.topicStatus === "none"
            ? "Shortlist three thesis directions"
            : "Stress-test your current thesis shortlist",
        rationale:
          "Your first win is reducing ambiguity. Three viable options are enough to start useful conversations.",
        ctaLabel: "Refine directions",
        ctaHref: "/diagnosis",
        tags: ["scope", "clarity"],
      },
      {
        id: "preview-action-2",
        kind: "person",
        title: input.hasSupervisorInMind
          ? "Prepare a first meeting with your likely supervisor"
          : "Identify and contact the first supervisor",
        rationale:
          "Supervisor feedback is the fastest way to validate whether your thesis direction is academically viable.",
        ctaLabel: "Open outreach plan",
        ctaHref: "/diagnosis",
        tags: ["supervisor", "alignment"],
      },
      {
        id: "preview-action-3",
        kind: "resource",
        title:
          skillGaps.length > 0
            ? `Close one readiness gap: ${skillGaps[0]}`
            : "Review one methodology primer",
        rationale:
          "You do not need to master everything before starting, but one targeted skill boost will reduce anxiety quickly.",
        ctaLabel: "Open learning path",
        ctaHref: null,
        tags: ["readiness", "learning"],
      },
    ],
  };
}
