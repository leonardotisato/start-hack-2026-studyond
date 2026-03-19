export type NodeStatus = "completed" | "active" | "upcoming" | "blocked";

export interface GraphNode {
  id: string;
  label: string;
  status: NodeStatus;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "default" | "active" | "suggested";
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
