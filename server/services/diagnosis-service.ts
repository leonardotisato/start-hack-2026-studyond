import type {
  ClarityLevel,
  ConversationTurn,
  DiagnosisInput,
  DiagnosisResult,
  RoadmapNode,
  ThesisStage,
} from "../../src/lib/contracts/diagnosis";

import { maybeGenerateAiSummary } from "./ai-service";
import {
  buildDirectionRecommendations,
  buildSupervisorRecommendations,
  getStageActions,
} from "./recommendation-service";

function computeReadinessScore(input: DiagnosisInput): number {
  let score = 50;

  // Confidence contribution (1-5 mapped to -20..+20)
  score += (input.confidence - 3) * 10;

  // Skill gaps penalty
  score -= input.skillGaps.length * 6;

  // Blockers penalty
  score -= input.blockers.length * 5;

  // Topic progress bonus
  const topicBonus: Record<string, number> = {
    none: -10,
    browsing: 0,
    shortlisted: 10,
    chosen: 20,
  };
  score += topicBonus[input.topicStatus] ?? 0;

  // Having interests is a positive signal
  score += Math.min(input.interests.length * 3, 12);

  // Supervisor in mind bonus
  if (input.hasSupervisorInMind) score += 8;

  // Expectations clarity bonus
  if (input.expectationsClear) score += 6;

  // Stage progression bonus
  const stageBonus: Record<ThesisStage, number> = {
    orientation: 0,
    topic_and_supervisor_search: 5,
    planning: 10,
    execution: 15,
    writing_and_finalization: 20,
  };
  score += stageBonus[input.currentStage] ?? 0;

  return Math.max(10, Math.min(95, score));
}

function computeClarityLevel(input: DiagnosisInput): ClarityLevel {
  let signals = 0;
  if (input.topicStatus === "shortlisted" || input.topicStatus === "chosen") signals++;
  if (input.hasSupervisorInMind) signals++;
  if (input.expectationsClear) signals++;
  if (input.confidence >= 4) signals++;
  if (input.interests.length >= 2) signals++;

  if (signals >= 4) return "high";
  if (signals >= 2) return "medium";
  return "low";
}

function deriveStrengths(input: DiagnosisInput): string[] {
  const strengths: string[] = [];

  if (input.interests.length >= 2) {
    strengths.push(
      `Clear interest direction with focus on ${input.interests.slice(0, 3).join(", ")}`,
    );
  }

  if (input.deadlineWeeks && input.deadlineWeeks >= 12) {
    strengths.push("Healthy time buffer before the thesis deadline");
  }

  if (input.confidence >= 3) {
    strengths.push("Reasonable self-confidence about the thesis journey");
  }

  if (input.hasSupervisorInMind) {
    strengths.push("Already considering potential supervisors");
  }

  if (input.expectationsClear) {
    strengths.push("Clear understanding of university expectations");
  }

  if (input.topicStatus === "shortlisted" || input.topicStatus === "chosen") {
    strengths.push("Topic exploration is already underway");
  }

  if (strengths.length === 0) {
    strengths.push("Motivation to start the thesis journey early and seek guidance");
  }

  return strengths;
}

function deriveGaps(input: DiagnosisInput): string[] {
  const gaps: string[] = [];

  if (input.skillGaps.length > 0) {
    gaps.push(
      `Self-identified skill gaps: ${input.skillGaps.join(", ")}`,
    );
  }

  if (input.topicStatus === "none" || input.topicStatus === "browsing") {
    gaps.push("No shortlist of thesis directions yet");
  }

  if (!input.hasSupervisorInMind) {
    gaps.push("No first supervisor outreach plan");
  }

  if (!input.expectationsClear) {
    gaps.push("University requirements and expectations are still unclear");
  }

  if (input.confidence <= 2) {
    gaps.push("Low confidence about the thesis process");
  }

  if (input.blockers.length > 0) {
    for (const blocker of input.blockers.slice(0, 2)) {
      gaps.push(blocker);
    }
  }

  return gaps;
}

function buildRoadmap(input: DiagnosisInput): RoadmapNode[] {
  const stages: { stage: ThesisStage; title: string; description: string; whyItMatters: string }[] = [
    {
      stage: "orientation",
      title: "Clarify thesis direction",
      description: "Reduce the possibility space to two or three thesis directions that feel feasible.",
      whyItMatters: "Without a narrower direction, every next step stays vague and overwhelming.",
    },
    {
      stage: "topic_and_supervisor_search",
      title: "Shortlist topics and supervisors",
      description: "Match with topics and professors who fit the desired direction.",
      whyItMatters: "A shortlist makes the outreach phase concrete and lowers the activation energy.",
    },
    {
      stage: "planning",
      title: "Validate scope and method",
      description: "Confirm the thesis is academically viable and specific enough to execute.",
      whyItMatters: "This is where many students discover that a topic sounded good but was not practical.",
    },
    {
      stage: "execution",
      title: "Execute the research",
      description: "Carry out the data collection, analysis, or development work defined in the plan.",
      whyItMatters: "This is the longest phase — steady progress and regular feedback prevent drift.",
    },
    {
      stage: "writing_and_finalization",
      title: "Write and finalize",
      description: "Draft the thesis, incorporate feedback, and prepare for submission.",
      whyItMatters: "Strong writing turns solid research into a convincing thesis document.",
    },
  ];

  const stageOrder: ThesisStage[] = [
    "orientation",
    "topic_and_supervisor_search",
    "planning",
    "execution",
    "writing_and_finalization",
  ];

  const currentIndex = stageOrder.indexOf(input.currentStage);
  let weekCounter = 1;

  return stages.map((s, index) => {
    let status: "done" | "current" | "next" | "blocked";
    if (index < currentIndex) {
      status = "done";
    } else if (index === currentIndex) {
      status = "current";
    } else if (index === currentIndex + 1) {
      status = "next";
    } else {
      status = "blocked";
    }

    const blockedBy: string[] = [];
    if (status === "blocked" && index > currentIndex + 1) {
      blockedBy.push(`Complete "${stages[index - 1].title}" first`);
    }

    const node: RoadmapNode = {
      id: `roadmap-${s.stage}`,
      title: s.title,
      stage: s.stage,
      status,
      description: s.description,
      whyItMatters: s.whyItMatters,
      blockedBy,
      suggestedWeek: weekCounter,
    };

    weekCounter += index <= currentIndex ? 0 : Math.ceil((input.deadlineWeeks ?? 16) / 5);
    return node;
  });
}

function buildDiagnosisSummary(
  input: DiagnosisInput,
  clarityLevel: ClarityLevel,
  readinessScore: number,
): string {
  const stageLabel = input.currentStage.replaceAll("_", " ");
  const confidenceWord =
    input.confidence <= 2 ? "low" : input.confidence <= 3 ? "moderate" : "solid";

  if (clarityLevel === "high") {
    return `You are in the ${stageLabel} phase with ${confidenceWord} confidence and a readiness score of ${readinessScore}/100. You have a clear direction — the main priority now is execution and refining your plan.`;
  }

  if (clarityLevel === "medium") {
    return `You are in the ${stageLabel} phase with ${confidenceWord} confidence. You have some direction but still need to narrow your focus. Your readiness score of ${readinessScore}/100 suggests the next priority is reducing ambiguity and choosing one concrete next step.`;
  }

  return `You are early in the ${stageLabel} phase with ${confidenceWord} confidence and a readiness score of ${readinessScore}/100. The first priority is not to know everything, but to make the thesis legible enough to take one concrete step forward.`;
}

function buildConfidenceNote(input: DiagnosisInput, clarityLevel: ClarityLevel): string {
  if (input.confidence <= 2) {
    return "Low confidence at this stage is normal. Your next goal is not to know everything, but to make the thesis legible enough to take the first concrete step.";
  }
  if (clarityLevel === "low") {
    return "You feel somewhat ready, but the path ahead is still unclear. Narrowing your focus to a few concrete options will quickly increase your confidence.";
  }
  if (clarityLevel === "high") {
    return "You are in a strong position. Stay focused on execution and use regular supervisor feedback to stay on track.";
  }
  return "You are making progress. The next milestone is to convert your current direction into a concrete plan with clear deliverables.";
}

export async function buildDiagnosisResult(
  input: DiagnosisInput,
  conversation: ConversationTurn[],
): Promise<DiagnosisResult> {
  const readinessScore = computeReadinessScore(input);
  const clarityLevel = computeClarityLevel(input);

  const [aiSummary, directions, supervisorRecs] = await Promise.all([
    maybeGenerateAiSummary(input, conversation),
    buildDirectionRecommendations(input),
    buildSupervisorRecommendations(input),
  ]);

  const stageActions = getStageActions(input.currentStage);
  const nextActions = [...supervisorRecs, ...stageActions].slice(0, 4);

  const chatSummary =
    conversation.length > 0
      ? conversation
          .filter((t) => t.role === "user")
          .map((t) => t.content)
          .join(" — ")
      : "No additional context from the conversation.";

  return {
    stage: input.currentStage,
    clarityLevel,
    readinessScore,
    diagnosisSummary:
      aiSummary ?? buildDiagnosisSummary(input, clarityLevel, readinessScore),
    chatSummary,
    strengths: deriveStrengths(input),
    gaps: deriveGaps(input),
    roadmap: buildRoadmap(input),
    directions,
    nextActions,
    confidenceNote: buildConfidenceNote(input, clarityLevel),
  };
}
