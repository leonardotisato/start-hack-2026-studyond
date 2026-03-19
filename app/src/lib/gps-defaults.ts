import type { GpsGraph } from "@/types/gps";

/** Default thesis pipeline with a branch (quantitative vs qualitative). */
export const DEFAULT_GRAPH: GpsGraph = {
  nodes: [
    {
      id: "topic-definition",
      label: "Topic Definition",
      state: "completed",
      description: "Define and refine the thesis topic with your supervisor.",
      estimatedDate: "2026-02-15",
      subtasks: [
        "Identify research gap",
        "Formulate research question",
        "Get supervisor approval",
      ],
    },
    {
      id: "literature-review",
      label: "Literature Review",
      state: "completed",
      description:
        "Survey existing research, identify key papers, and map the state of the art.",
      estimatedDate: "2026-03-15",
      subtasks: [
        "Search databases (Scholar, Scopus)",
        "Read 20-30 key papers",
        "Write literature summary",
        "Identify research gaps",
      ],
    },
    {
      id: "methodology",
      label: "Methodology Design",
      state: "active",
      description: "Choose and justify your research methodology.",
      estimatedDate: "2026-04-01",
      subtasks: [
        "Select research approach",
        "Define variables and metrics",
        "Design experiments",
        "Write methodology section",
        "Validate with supervisor",
      ],
    },
    {
      id: "quantitative-path",
      label: "Quantitative Analysis",
      state: "upcoming",
      description: "Statistical analysis with surveys and numerical data.",
      estimatedDate: "2026-05-01",
      subtasks: [
        "Design survey instrument",
        "Collect numerical data",
        "Run statistical tests",
        "Create data visualizations",
      ],
    },
    {
      id: "qualitative-path",
      label: "Qualitative Analysis",
      state: "upcoming",
      description: "Interview-based research with thematic analysis.",
      estimatedDate: "2026-05-01",
      subtasks: [
        "Design interview protocol",
        "Conduct 8-12 interviews",
        "Transcribe and code data",
        "Perform thematic analysis",
      ],
    },
    {
      id: "first-draft",
      label: "First Draft",
      state: "upcoming",
      description: "Write the complete first draft of your thesis.",
      estimatedDate: "2026-05-20",
      subtasks: [
        "Write introduction",
        "Write methodology chapter",
        "Write results chapter",
        "Write discussion",
        "Write conclusion",
      ],
    },
    {
      id: "supervisor-review",
      label: "Supervisor Review",
      state: "upcoming",
      description:
        "Submit draft for supervisor feedback and incorporate revisions.",
      estimatedDate: "2026-06-05",
      subtasks: [
        "Submit draft to supervisor",
        "Address feedback points",
        "Revise weak chapters",
        "Final review meeting",
      ],
    },
    {
      id: "final-submission",
      label: "Final Submission",
      state: "upcoming",
      description: "Finalize and submit the thesis.",
      estimatedDate: "2026-06-20",
      subtasks: [
        "Proofread entire document",
        "Format per university guidelines",
        "Prepare presentation slides",
        "Submit final version",
      ],
    },
  ],
  edges: [
    { id: "e-topic-lit", source: "topic-definition", target: "literature-review" },
    { id: "e-lit-method", source: "literature-review", target: "methodology" },
    { id: "e-method-quant", source: "methodology", target: "quantitative-path" },
    { id: "e-method-qual", source: "methodology", target: "qualitative-path" },
    { id: "e-quant-draft", source: "quantitative-path", target: "first-draft" },
    { id: "e-qual-draft", source: "qualitative-path", target: "first-draft" },
    { id: "e-draft-review", source: "first-draft", target: "supervisor-review" },
    { id: "e-review-final", source: "supervisor-review", target: "final-submission" },
  ],
};

/** Pre-completed subtasks: first 2 nodes fully done, methodology partially. */
export const DEFAULT_COMPLETED_SUBTASKS: Record<string, number[]> = {
  "topic-definition": [0, 1, 2],
  "literature-review": [0, 1, 2, 3],
  methodology: [0, 1],
};
