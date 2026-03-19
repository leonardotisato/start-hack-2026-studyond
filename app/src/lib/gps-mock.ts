import type { GpsGraph, GpsProposal } from "@/types/gps";

export function mockInitGraph(professorPrompt: string): { graph: GpsGraph; message: string } {
  return {
    graph: {
      nodes: [
        { id: "topic-definition", label: "Topic Definition", state: "completed", description: "Define and refine the thesis topic with your supervisor.", subtasks: ["Identify research gap", "Formulate research question", "Get supervisor approval"] },
        { id: "literature-review", label: "Literature Review", state: "active", description: "Survey existing research, identify key papers, and map the state of the art.", estimatedDate: "2026-04-15", subtasks: ["Search databases (Scholar, Scopus)", "Read 20-30 key papers", "Write literature summary", "Identify gaps"] },
        { id: "methodology", label: "Methodology Design", state: "upcoming", description: "Choose and justify your research methodology.", estimatedDate: "2026-05-01", subtasks: ["Select research approach", "Design experiments/surveys", "Validate with supervisor"] },
        { id: "data-collection", label: "Data Collection", state: "upcoming", description: "Gather data according to your methodology.", estimatedDate: "2026-05-20", subtasks: ["Prepare instruments", "Collect data", "Clean and organize dataset"] },
        { id: "analysis", label: "Analysis", state: "upcoming", description: "Analyze collected data and interpret results.", estimatedDate: "2026-06-05", subtasks: ["Run statistical analysis", "Create visualizations", "Interpret findings"] },
        { id: "first-draft", label: "First Draft", state: "upcoming", description: "Write the complete first draft of your thesis.", estimatedDate: "2026-06-20", subtasks: ["Write introduction", "Write methodology chapter", "Write results chapter", "Write discussion", "Write conclusion"] },
        { id: "supervisor-review", label: "Supervisor Review", state: "upcoming", description: "Submit draft for supervisor feedback and incorporate revisions.", estimatedDate: "2026-07-05", subtasks: ["Submit to supervisor", "Address feedback", "Revise chapters"] },
        { id: "final-submission", label: "Final Submission", state: "upcoming", description: "Finalize and submit the thesis.", estimatedDate: "2026-07-20", subtasks: ["Final proofreading", "Format according to guidelines", "Submit"] },
      ],
      edges: [
        { id: "e-topic-lit", source: "topic-definition", target: "literature-review" },
        { id: "e-lit-method", source: "literature-review", target: "methodology" },
        { id: "e-method-data", source: "methodology", target: "data-collection" },
        { id: "e-data-analysis", source: "data-collection", target: "analysis" },
        { id: "e-analysis-draft", source: "analysis", target: "first-draft" },
        { id: "e-draft-review", source: "first-draft", target: "supervisor-review" },
        { id: "e-review-final", source: "supervisor-review", target: "final-submission" },
      ],
    },
    message: "I've created your thesis pipeline. You're currently on the Literature Review phase. Click any node to see details and subtasks.",
  };
}

export function mockAgentProposal(userMessage: string): GpsProposal {
  const lower = userMessage.toLowerCase();

  if (lower.includes("stuck") || lower.includes("help") || lower.includes("blocked")) {
    return {
      addNodes: [
        { id: "peer-discussion", label: "Peer Discussion", state: "upcoming", description: "Schedule a discussion with peers to unblock your thinking.", subtasks: ["Identify 2-3 relevant peers", "Schedule 30-min session", "Prepare specific questions"] },
      ],
      updateNodes: [],
      removeNodeIds: [],
      addEdges: [
        { id: "e-lit-peer", source: "literature-review", target: "peer-discussion", isSuggestion: true },
        { id: "e-peer-method", source: "peer-discussion", target: "methodology", isSuggestion: true },
      ],
      removeEdgeIds: [],
      completeSubtasks: [],
      addEvents: [],
      message: "Adding a Peer Discussion step to help you get unstuck. You can accept or reject this change.",
    };
  }

  if (lower.includes("expert") || lower.includes("mentor") || lower.includes("supervisor") || lower.includes("funding") || lower.includes("data") || lower.includes("contact")) {
    return {
      addNodes: [],
      updateNodes: [],
      removeNodeIds: [],
      addEdges: [],
      removeEdgeIds: [],
      completeSubtasks: [],
      addEvents: [],
      message: "I found some people who could help you. Take a look at the suggestions below.",
      recommend: { type: "expert" as const, reason: "Student needs expert guidance", keywords: userMessage.split(" ").filter((w) => w.length > 3) },
    };
  }

  if (lower.includes("parallel") || lower.includes("faster") || lower.includes("speed")) {
    return {
      addNodes: [],
      updateNodes: [],
      removeNodeIds: [],
      addEdges: [
        { id: "e-lit-draft-parallel", source: "literature-review", target: "first-draft", isSuggestion: true },
      ],
      removeEdgeIds: [],
      completeSubtasks: [],
      addEvents: [],
      message: "Added a parallel path so you can start writing while still in the literature phase.",
    };
  }

  // Default: just answer without graph changes
  return {
    addNodes: [],
    updateNodes: [],
    removeNodeIds: [],
    addEdges: [],
    removeEdgeIds: [],
    completeSubtasks: [],
    addEvents: [],
    message: "Based on your progress, focus on completing the current active step. Let me know if you need specific advice.",
  };
}
