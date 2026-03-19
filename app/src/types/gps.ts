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

export interface GpsSubtaskCompletion {
  nodeId: string;
  subtaskIndices: number[]; // indices of subtasks to mark as completed
}

export interface GpsProposal {
  addNodes: GpsNode[];
  updateNodes: GpsNodeUpdate[];
  removeNodeIds: string[];
  addEdges: GpsEdge[];
  removeEdgeIds: string[];
  completeSubtasks: GpsSubtaskCompletion[];
  message: string;
  recommend?: RecommendationRequest;
}

// -- API request/response --

export interface GpsConversationMessage {
  role: "user" | "agent";
  content: string;
}

export interface GpsAgentRequest {
  graph: GpsGraph;
  projectId: string;
  userMessage?: string;
  completedSubtasks?: Record<string, number[]>;
  conversationHistory?: GpsConversationMessage[];
}

export interface GpsAgentResponse {
  proposal: GpsProposal;
}

// -- Recommendations (sub-agent results) --

export type RecommendationType = "supervisor" | "expert" | "company" | "topic";

export interface RecommendationRequest {
  type: RecommendationType;
  reason: string; // brief explanation of why the user needs this
  keywords: string[]; // search terms for matching
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  name: string;
  title: string; // role/position or description
  affiliation: string; // university or company name
  email: string;
  reason: string; // why this person/entity is relevant
  matchScore: number; // 0-1
  fieldNames: string[]; // resolved field names for display
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
