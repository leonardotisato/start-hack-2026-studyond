import type { GpsGraph, GpsNode, GpsEdge, GpsNodeState } from "@/types/gps";

/**
 * Compute node states purely from subtask completion + edge dependencies.
 * - All subtasks done → "completed"
 * - All predecessors completed → "active" (interactable)
 * - Otherwise → "upcoming" (locked)
 */
export function computeNodeStates(
  graph: GpsGraph,
  completedSubtasks: Record<string, number[]>
): GpsNode[] {
  // Build predecessor map (needed for no-subtask node resolution)
  const predsMap = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = predsMap.get(edge.target) ?? [];
    list.push(edge.source);
    predsMap.set(edge.target, list);
  }

  // First pass: determine which nodes have all subtasks completed
  // Nodes with no subtasks are completed if all predecessors are completed
  const completedIds = new Set<string>();
  // Iterative resolution for no-subtask nodes that depend on each other
  let changed = true;
  // Start with nodes that have subtasks all checked
  for (const node of graph.nodes) {
    const total = node.subtasks?.length ?? 0;
    const done = (completedSubtasks[node.id] ?? []).length;
    if (total > 0 && done >= total) completedIds.add(node.id);
  }
  // Then resolve no-subtask nodes
  while (changed) {
    changed = false;
    for (const node of graph.nodes) {
      if (completedIds.has(node.id)) continue;
      const total = node.subtasks?.length ?? 0;
      if (total > 0) continue; // has subtasks but not all done
      const nodePreds = predsMap.get(node.id) ?? [];
      const allPredsCompleted =
        nodePreds.length === 0 || nodePreds.every((id) => completedIds.has(id));
      if (allPredsCompleted) {
        completedIds.add(node.id);
        changed = true;
      }
    }
  }

  // Second pass: compute state for each node
  return graph.nodes.map((node): GpsNode => {
    if (completedIds.has(node.id)) {
      return { ...node, state: "completed" };
    }

    const nodePreds = predsMap.get(node.id) ?? [];
    const allPredsCompleted =
      nodePreds.length === 0 || nodePreds.every((id) => completedIds.has(id));

    if (allPredsCompleted) {
      return { ...node, state: "active" };
    }

    return { ...node, state: "upcoming" };
  });
}

/**
 * Compute horizontal layout positions using longest-path depth.
 * Main path is horizontal; branches fan out vertically.
 */
export function layoutGraph(
  nodes: GpsNode[],
  edges: GpsEdge[]
): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map();

  const nodeIds = new Set(nodes.map((n) => n.id));
  const successors = new Map<string, string[]>();
  const predCount = new Map<string, number>();

  for (const n of nodes) {
    successors.set(n.id, []);
    predCount.set(n.id, 0);
  }
  for (const e of edges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      successors.get(e.source)!.push(e.target);
      predCount.set(e.target, (predCount.get(e.target) ?? 0) + 1);
    }
  }

  // Longest-path BFS for depth
  const depth = new Map<string, number>();
  function visit(id: string, d: number) {
    if ((depth.get(id) ?? -1) >= d) return;
    depth.set(id, d);
    for (const succ of successors.get(id) ?? []) {
      visit(succ, d + 1);
    }
  }
  for (const n of nodes) {
    if ((predCount.get(n.id) ?? 0) === 0) visit(n.id, 0);
  }

  // Group by depth level
  const levels = new Map<number, string[]>();
  for (const [id, d] of depth) {
    const list = levels.get(d) ?? [];
    list.push(id);
    levels.set(d, list);
  }

  const xSpacing = 300;
  const ySpacing = 160;
  const centerY = 280;

  const positions = new Map<string, { x: number; y: number }>();
  for (const [d, ids] of levels) {
    const totalHeight = (ids.length - 1) * ySpacing;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: d * xSpacing + 50,
        y: centerY + i * ySpacing - totalHeight / 2,
      });
    });
  }

  return positions;
}

/**
 * Find sibling branch nodes (other targets from the same parent).
 */
export function getBranchSiblings(
  graph: GpsGraph,
  nodeId: string
): string[] {
  const siblings = new Set<string>();
  const inEdges = graph.edges.filter((e) => e.target === nodeId);
  for (const edge of inEdges) {
    const outEdges = graph.edges.filter(
      (e) => e.source === edge.source && e.target !== nodeId
    );
    for (const e of outEdges) siblings.add(e.target);
  }
  return [...siblings];
}

/**
 * Check if this node is part of a branch (has siblings from the same parent).
 */
export function isBranchNode(
  graph: GpsGraph,
  nodeId: string
): boolean {
  return getBranchSiblings(graph, nodeId).length > 0;
}

/**
 * Choose a branch: keep the chosen node, remove all sibling branches.
 */
export function chooseBranch(
  graph: GpsGraph,
  chosenNodeId: string
): GpsGraph {
  const siblings = getBranchSiblings(graph, chosenNodeId);
  const toRemove = new Set(siblings);
  return {
    nodes: graph.nodes.filter((n) => !toRemove.has(n.id)),
    edges: graph.edges.filter(
      (e) => !toRemove.has(e.source) && !toRemove.has(e.target)
    ),
  };
}

/**
 * Check if a node's subtasks can be toggled (all predecessors completed).
 */
export function isNodeInteractable(
  graph: GpsGraph,
  nodeId: string,
  completedSubtasks: Record<string, number[]>
): boolean {
  const completedIds = new Set<string>();
  for (const node of graph.nodes) {
    const total = node.subtasks?.length ?? 0;
    const done = (completedSubtasks[node.id] ?? []).length;
    if (total > 0 && done >= total) completedIds.add(node.id);
  }

  const predIds = graph.edges
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);

  return predIds.length === 0 || predIds.every((id) => completedIds.has(id));
}

/**
 * Get subtask progress for a node.
 */
export function getNodeProgress(
  node: GpsNode,
  completedSubtasks: Record<string, number[]>
): { done: number; total: number; fraction: number } {
  const total = node.subtasks?.length ?? 0;
  const done = (completedSubtasks[node.id] ?? []).length;
  return { done, total, fraction: total > 0 ? done / total : 0 };
}
