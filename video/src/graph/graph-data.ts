import { GraphLayout, GraphNode, GraphEdge, NodeStatus } from "./types";

// DAG layout constants
const COL_WIDTH = 220;
const ROW_HEIGHT = 140;
const LEFT_PAD = 160;
const TOP_PAD = 80;

function pos(col: number, row: number): { x: number; y: number } {
  return { x: LEFT_PAD + col * COL_WIDTH, y: TOP_PAD + row * ROW_HEIGHT };
}

// ── Initial 8-node layout ──
export const initialNodes: GraphNode[] = [
  { id: "problem",    label: "Problem Definition",   status: "upcoming", ...pos(0, 1) },
  { id: "litreview",  label: "Lit Review",           status: "upcoming", ...pos(1, 1) },
  { id: "pipeline",   label: "Data Pipeline Design", status: "upcoming", ...pos(2, 1) },
  { id: "feature",    label: "Feature Engineering",  status: "upcoming", ...pos(3, 0) },
  { id: "training",   label: "Model Training",       status: "upcoming", ...pos(3, 2) },
  { id: "eval",       label: "Model Evaluation",     status: "upcoming", ...pos(4, 1) },
  { id: "draft",      label: "Thesis Draft",         status: "upcoming", ...pos(5, 1) },
  { id: "review",     label: "Supervisor Review",    status: "upcoming", ...pos(6, 0) },
  { id: "submission", label: "Final Submission",     status: "upcoming", ...pos(7, 1) },
];

export const initialEdges: GraphEdge[] = [
  { from: "problem",   to: "litreview",  type: "default" },
  { from: "litreview",  to: "pipeline",   type: "default" },
  { from: "pipeline",   to: "feature",    type: "default" },
  { from: "pipeline",   to: "training",   type: "default" },
  { from: "feature",    to: "eval",       type: "default" },
  { from: "training",   to: "eval",       type: "default" },
  { from: "eval",       to: "draft",      type: "default" },
  { from: "draft",      to: "review",     type: "default" },
  { from: "review",     to: "submission", type: "default" },
];

export const initialLayout: GraphLayout = {
  nodes: initialNodes,
  edges: initialEdges,
};

// ── After AI restructure: 9 nodes with Data Augmentation inserted ──
export const restructuredNodes: GraphNode[] = [
  { id: "problem",    label: "Problem Definition",   status: "completed", ...pos(0, 1) },
  { id: "litreview",  label: "Lit Review",           status: "completed", ...pos(1, 1) },
  { id: "pipeline",   label: "Data Pipeline Design", status: "completed", ...pos(2, 1) },
  { id: "feature",    label: "Feature Engineering",  status: "active",    ...pos(3, 0) },
  { id: "augment",    label: "Data Augmentation",    status: "upcoming",  ...pos(3.5, 2) },
  { id: "training",   label: "Model Training",       status: "upcoming",  ...pos(4.5, 2) },
  { id: "eval",       label: "Model Evaluation",     status: "upcoming",  ...pos(5, 1) },
  { id: "draft",      label: "Thesis Draft",         status: "upcoming",  ...pos(6, 1) },
  { id: "review",     label: "Supervisor Review",    status: "upcoming",  ...pos(7, 0) },
  { id: "submission", label: "Final Submission",     status: "upcoming",  ...pos(8, 1) },
];

export const restructuredEdges: GraphEdge[] = [
  { from: "problem",   to: "litreview",  type: "default" },
  { from: "litreview",  to: "pipeline",   type: "default" },
  { from: "pipeline",   to: "feature",    type: "default" },
  { from: "pipeline",   to: "augment",    type: "active" },
  { from: "augment",    to: "training",   type: "active" },
  { from: "feature",    to: "eval",       type: "default" },
  { from: "training",   to: "eval",       type: "default" },
  { from: "eval",       to: "draft",      type: "default" },
  { from: "draft",      to: "review",     type: "default" },
  { from: "review",     to: "submission", type: "default" },
];

export const restructuredLayout: GraphLayout = {
  nodes: restructuredNodes,
  edges: restructuredEdges,
};

// ── Graph Reveal: progressive status assignment ──
export function getRevealNodes(progress: number): GraphNode[] {
  return initialNodes.map((node, i) => {
    const threshold = i / initialNodes.length;
    const status: NodeStatus =
      progress > threshold + 0.1 ? "completed" :
      progress > threshold ? "active" :
      "upcoming";
    return { ...node, status };
  });
}

// ── Progress Montage: week-by-week progression ──
const weekStatuses: NodeStatus[][] = [
  // Week 1-2: problem done, litreview active
  ["completed", "active", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"],
  // Week 3-4: litreview done, pipeline active
  ["completed", "completed", "active", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"],
  // Week 5-6: pipeline done, feature+augment active
  ["completed", "completed", "completed", "active", "active", "upcoming", "upcoming", "upcoming", "upcoming"],
  // Week 7-8: feature+augment done, training active
  ["completed", "completed", "completed", "completed", "completed", "active", "upcoming", "upcoming", "upcoming"],
  // Week 9-10: training done, eval active
  ["completed", "completed", "completed", "completed", "completed", "completed", "active", "upcoming", "upcoming"],
  // Week 11-12: eval done, draft active
  ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "active", "upcoming"],
  // Week 13-14: draft done, review active
  ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "completed", "active"],
  // Week 15-16: all done
  ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "completed", "completed"],
];

export function getProgressNodes(weekIndex: number): GraphNode[] {
  const statuses = weekStatuses[Math.min(weekIndex, weekStatuses.length - 1)];
  return restructuredNodes.map((node, i) => ({
    ...node,
    // Skip augment node for first couple of weeks since it appears mid-way
    status: statuses[i] ?? "upcoming",
  }));
}

export const TOTAL_WEEKS = weekStatuses.length;
