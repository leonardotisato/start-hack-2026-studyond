import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { theme } from "../theme";
import { NodeStatus } from "./types";
import { activePulse } from "../utils/animation";
import { geist } from "../utils/fonts";

const NODE_WIDTH = 170;
const NODE_HEIGHT = 56;

const statusColors: Record<NodeStatus, string> = {
  completed: theme.colors.nodeCompleted,
  active: theme.colors.nodeActive,
  upcoming: theme.colors.nodeUpcoming,
  blocked: theme.colors.nodeBlocked,
};

interface GraphNodeProps {
  id: string;
  label: string;
  status: NodeStatus;
  x: number;
  y: number;
  delay?: number;
  isNew?: boolean;
}

export const GraphNodeComponent: React.FC<GraphNodeProps> = ({
  id,
  label,
  status,
  x,
  y,
  delay = 0,
  isNew = false,
}) => {
  const frame = useCurrentFrame();
  const color = statusColors[status];

  const scale = spring({
    frame: frame - delay,
    fps: 30,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
    durationInFrames: 25,
  });

  const glowOpacity = status === "active" ? activePulse(frame) : 0;

  return (
    <g
      transform={`translate(${x - NODE_WIDTH / 2}, ${y - NODE_HEIGHT / 2}) scale(${scale})`}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Glow for active nodes */}
      {status === "active" && (
        <rect
          x={-4}
          y={-4}
          width={NODE_WIDTH + 8}
          height={NODE_HEIGHT + 8}
          rx={theme.radii.md + 2}
          fill="none"
          stroke={color}
          strokeWidth={3}
          opacity={glowOpacity}
        />
      )}

      {/* Dashed border for new/proposed nodes */}
      {isNew && (
        <rect
          x={-2}
          y={-2}
          width={NODE_WIDTH + 4}
          height={NODE_HEIGHT + 4}
          rx={theme.radii.md + 1}
          fill="none"
          stroke={theme.colors.edgeSuggested}
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      )}

      {/* Main rect */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={theme.radii.md}
        fill={theme.colors.background}
        stroke={color}
        strokeWidth={2.5}
      />

      {/* Status dot */}
      <circle cx={20} cy={NODE_HEIGHT / 2} r={6} fill={color} />

      {/* Label */}
      <text
        x={34}
        y={NODE_HEIGHT / 2}
        dominantBaseline="central"
        fontFamily={geist}
        fontSize={12}
        fontWeight={500}
        fill={theme.colors.foreground}
      >
        {label.length > 18 ? label.slice(0, 17) + "..." : label}
      </text>
    </g>
  );
};
