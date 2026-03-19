import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { GraphNodeComponent } from "./GraphNode";
import { GraphEdgeComponent } from "./GraphEdge";
import { GraphNode } from "./types";

interface GraphProposalProps {
  node: GraphNode;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
}

export const GraphProposal: React.FC<GraphProposalProps> = ({
  node,
  fromX,
  fromY,
  toX,
  toY,
  delay,
}) => {
  const frame = useCurrentFrame();

  const opacity = spring({
    frame: frame - delay,
    fps: 30,
    config: { mass: 0.8, damping: 15, stiffness: 120 },
    durationInFrames: 30,
  });

  return (
    <g opacity={opacity}>
      <GraphEdgeComponent
        fromX={fromX}
        fromY={fromY}
        toX={node.x}
        toY={node.y}
        type="suggested"
        delay={delay + 5}
        duration={15}
      />
      <GraphEdgeComponent
        fromX={node.x}
        fromY={node.y}
        toX={toX}
        toY={toY}
        type="suggested"
        delay={delay + 10}
        duration={15}
      />
      <GraphNodeComponent
        {...node}
        delay={delay}
        isNew
      />
    </g>
  );
};
