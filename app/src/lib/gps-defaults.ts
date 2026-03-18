import type { GpsGraph, GpsNode, GpsEdge } from "@/types/gps";
import type { ProjectState } from "@/types";

const DEFAULT_STEPS: { id: string; label: string; description: string }[] = [
  { id: "topic-selection", label: "Topic Selection", description: "Choose and refine your thesis topic" },
  { id: "proposal", label: "Proposal", description: "Write and submit your thesis proposal" },
  { id: "literature-review", label: "Literature Review", description: "Survey existing research and identify gaps" },
  { id: "methodology", label: "Methodology", description: "Define your research approach and methods" },
  { id: "data-collection", label: "Data Collection", description: "Gather data, run experiments, or build prototypes" },
  { id: "analysis", label: "Analysis", description: "Analyze results and draw conclusions" },
  { id: "writing", label: "Writing", description: "Write the thesis document" },
  { id: "review", label: "Review & Revision", description: "Incorporate feedback and finalize" },
  { id: "delivery", label: "Delivery", description: "Submit the final thesis" },
];

const STATE_TO_ACTIVE_STEP: Record<ProjectState, string> = {
  proposed: "topic-selection",
  applied: "topic-selection",
  withdrawn: "topic-selection",
  rejected: "topic-selection",
  agreed: "proposal",
  in_progress: "methodology",
  canceled: "topic-selection",
  completed: "delivery",
};

export function buildDefaultGraph(projectState: ProjectState): GpsGraph {
  const activeStepId = STATE_TO_ACTIVE_STEP[projectState];
  const activeIndex = DEFAULT_STEPS.findIndex((s) => s.id === activeStepId);

  const nodes: GpsNode[] = DEFAULT_STEPS.map((step, i) => ({
    id: step.id,
    label: step.label,
    description: step.description,
    state:
      i < activeIndex
        ? "completed"
        : i === activeIndex
          ? "active"
          : "upcoming",
  }));

  const edges: GpsEdge[] = DEFAULT_STEPS.slice(0, -1).map((step, i) => ({
    id: `${step.id}->${DEFAULT_STEPS[i + 1].id}`,
    source: step.id,
    target: DEFAULT_STEPS[i + 1].id,
  }));

  return { nodes, edges };
}
