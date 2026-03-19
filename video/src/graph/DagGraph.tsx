import React from "react";
import { GraphNodeComponent } from "./GraphNode";
import { GraphEdgeComponent } from "./GraphEdge";
import { GraphLayout } from "./types";

interface DagGraphProps {
  layout: GraphLayout;
  width?: number;
  height?: number;
  baseDelay?: number;
  nodeDelayStep?: number;
  edgeDelayStep?: number;
  showNewNodes?: string[];
}

export const DagGraph: React.FC<DagGraphProps> = ({
  layout,
  width = 1920,
  height = 600,
  baseDelay = 0,
  nodeDelayStep = 6,
  edgeDelayStep = 4,
  showNewNodes = [],
}) => {
  const nodeMap = new Map(layout.nodes.map((n) => [n.id, n]));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Edges first (behind nodes) */}
      {layout.edges.map((edge, i) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        return (
          <GraphEdgeComponent
            key={`${edge.from}-${edge.to}`}
            fromX={from.x}
            fromY={from.y}
            toX={to.x}
            toY={to.y}
            type={edge.type}
            delay={baseDelay + i * edgeDelayStep}
            duration={15}
          />
        );
      })}

      {/* Nodes */}
      {layout.nodes.map((node, i) => (
        <GraphNodeComponent
          key={node.id}
          {...node}
          delay={baseDelay + i * nodeDelayStep}
          isNew={showNewNodes.includes(node.id)}
        />
      ))}
    </svg>
  );
};
