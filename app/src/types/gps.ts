// -- Node & Edge types (shared between agent and UI) --

export type GpsNodeState = "completed" | "active" | "upcoming" | "blocked";

export interface GpsNode {
  id: string;
  label: string;
  state: GpsNodeState;
  description?: string;
  estimatedDate?: string;
  subtasks?: string[];
}

export interface GpsEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  isSuggestion?: boolean;
}

// -- Graph state (full snapshot) --

export interface GpsGraph {
  nodes: GpsNode[];
  edges: GpsEdge[];
}

// -- Agent proposal (what the agent returns) --

export interface GpsNodeUpdate {
  id: string;
  patch: Partial<Omit<GpsNode, "id">>;
}

export interface GpsProposal {
  addNodes: GpsNode[];
  updateNodes: GpsNodeUpdate[];
  removeNodeIds: string[];
  addEdges: GpsEdge[];
  removeEdgeIds: string[];
  message: string;
}

// -- API request/response --

export interface GpsAgentRequest {
  graph: GpsGraph;
  projectId: string;
  userMessage?: string;
  completedSubtasks?: Record<string, number[]>;
}

export interface GpsAgentResponse {
  proposal: GpsProposal;
}

// -- Init request (professor prompt → initial graph) --

export interface GpsInitRequest {
  projectId: string;
  professorPrompt: string;
}

export interface GpsInitResponse {
  graph: GpsGraph;
  message: string;
}
