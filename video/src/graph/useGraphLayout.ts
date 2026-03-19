import { interpolate } from "remotion";
import { GraphNode, GraphLayout } from "./types";

export function interpolateLayout(
  before: GraphLayout,
  after: GraphLayout,
  progress: number
): GraphLayout {
  const nodeMap = new Map<string, GraphNode>();

  // Add all "before" nodes
  for (const node of before.nodes) {
    nodeMap.set(node.id, { ...node });
  }

  // Interpolate positions for nodes that exist in both
  for (const afterNode of after.nodes) {
    const beforeNode = nodeMap.get(afterNode.id);
    if (beforeNode) {
      nodeMap.set(afterNode.id, {
        ...afterNode,
        x: interpolate(progress, [0, 1], [beforeNode.x, afterNode.x]),
        y: interpolate(progress, [0, 1], [beforeNode.y, afterNode.y]),
        status: progress > 0.5 ? afterNode.status : beforeNode.status,
      });
    } else {
      // New node: fade in at its final position
      nodeMap.set(afterNode.id, {
        ...afterNode,
        x: afterNode.x,
        y: afterNode.y,
      });
    }
  }

  return {
    nodes: after.nodes.map((n) => nodeMap.get(n.id)!),
    edges: progress > 0.3 ? after.edges : before.edges,
  };
}
