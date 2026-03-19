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

export type ProposedEventType = "milestone" | "meeting" | "deadline";

export interface ProposedEvent {
  date: string; // YYYY-MM-DD
  label: string;
  type: ProposedEventType;
  attendees?: string[]; // e.g. ["Prof. Mueller", "Student"]
}

export interface GpsProposal {
  addNodes: GpsNode[];
  updateNodes: GpsNodeUpdate[];
  removeNodeIds: string[];
  addEdges: GpsEdge[];
  removeEdgeIds: string[];
  completeSubtasks: GpsSubtaskCompletion[];
  addEvents: ProposedEvent[];
  message: string;
  recommend?: RecommendationRequest;
}

// -- Attachable context sources --

export type ContextSource =
  | "supervisors"
  | "experts"
  | "companies"
  | "topics"
  | "universities"
  | "programs";

export const CONTEXT_SOURCE_META: Record<
  ContextSource,
  { label: string; icon: string; description: string }
> = {
  supervisors: { label: "Supervisors", icon: "🎓", description: "Academic professors and advisors" },
  experts: { label: "Experts", icon: "💼", description: "Industry professionals at companies" },
  companies: { label: "Companies", icon: "🏢", description: "Companies offering thesis partnerships" },
  topics: { label: "Topics", icon: "📄", description: "Available thesis topics and job listings" },
  universities: { label: "Universities", icon: "🏛️", description: "Swiss universities and institutions" },
  programs: { label: "Programs", icon: "📚", description: "Study programs (BSc, MSc, PhD)" },
};

// -- API request/response --

export interface GpsConversationMessage {
  role: "user" | "agent";
  content: string;
}

export interface ScoutConversationAttachment {
  nodeId: string;
  nodeLabel: string;
  messages: { role: string; content: string }[];
}

export interface GpsAgentRequest {
  graph: GpsGraph;
  projectId: string;
  userMessage?: string;
  completedSubtasks?: Record<string, number[]>;
  conversationHistory?: GpsConversationMessage[];
  attachedContext?: ContextSource[];
  attachedScoutConversations?: ScoutConversationAttachment[];
}

export interface GpsAgentResponse {
  proposal: GpsProposal;
}

// -- Recommendations (sub-agent results) --

export type RecommendationType = "supervisor" | "expert" | "company" | "topic" | "university" | "program";

export interface RecommendationRequest {
  type: RecommendationType | "all";
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

// -- Scout conversational agent --

export interface ScoutMessage {
  role: "user" | "scout";
  content: string;
  recommendations?: Recommendation[];
  hasProposal?: boolean;
}

export interface ScoutSuggestionSummary {
  id: string;
  name: string;
  type: string;
  affiliation: string;
}

export interface ScoutAgentRequest {
  projectId: string;
  nodeId: string;
  userMessage: string;
  graph: GpsGraph;
  completedSubtasks: Record<string, number[]>;
  conversationHistory: ScoutMessage[];
  currentSuggestions: ScoutSuggestionSummary[];
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
