import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { GraphEdge as EdgeType } from "./types";

interface GraphEdgeProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: EdgeType["type"];
  delay?: number;
  duration?: number;
}

const edgeColors: Record<EdgeType["type"], string> = {
  default: theme.colors.edgeDefault,
  active: theme.colors.edgeActive,
  suggested: theme.colors.edgeSuggested,
};

export const GraphEdgeComponent: React.FC<GraphEdgeProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  type,
  delay = 0,
  duration = 20,
}) => {
  const frame = useCurrentFrame();

  // Bezier control points for curved edges
  const midX = (fromX + toX) / 2;
  const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

  // Approximate path length
  const dx = toX - fromX;
  const dy = toY - fromY;
  const pathLength = Math.sqrt(dx * dx + dy * dy) * 1.2;

  const drawProgress = interpolate(
    frame,
    [delay, delay + duration],
    [pathLength, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const color = edgeColors[type];
  const isDashed = type === "suggested";

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={type === "active" ? 2.5 : 2}
      strokeDasharray={isDashed ? "8 5" : `${pathLength}`}
      strokeDashoffset={isDashed ? 0 : drawProgress}
      strokeLinecap="round"
      opacity={frame < delay ? 0 : 1}
    />
  );
};
