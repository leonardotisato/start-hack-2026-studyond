"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GpsNodeState } from "@/types/gps";

export interface GpsNodeData {
  label: string;
  state: GpsNodeState;
  description?: string;
  estimatedDate?: string;
  subtasks?: string[];
  isProposed?: boolean;
  isProposalAdd?: boolean;
  isProposalRemove?: boolean;
  isProposalUpdate?: boolean;
  [key: string]: unknown;
}

const STATE_STYLES: Record<GpsNodeState, { bg: string; border: string; text: string; dot: string }> = {
  completed: {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  active: {
    bg: "bg-blue-50",
    border: "border-blue-500 shadow-md shadow-blue-200",
    text: "text-blue-800",
    dot: "bg-blue-500 animate-pulse",
  },
  upcoming: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-500",
    dot: "bg-gray-300",
  },
  blocked: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export function GpsNodeComponent({ data }: NodeProps) {
  const nodeData = data as GpsNodeData;
  const style = STATE_STYLES[nodeData.state] ?? STATE_STYLES.upcoming;

  let proposalOutline = "";
  let opacity = "";
  if (nodeData.isProposalRemove) {
    proposalOutline = "outline outline-2 outline-red-500 outline-dashed";
    opacity = "opacity-40";
  } else if (nodeData.isProposalAdd) {
    proposalOutline = "outline outline-2 outline-green-500 outline-dashed";
  } else if (nodeData.isProposalUpdate) {
    proposalOutline = "outline outline-2 outline-amber-500 outline-dashed";
  } else if (nodeData.isProposed) {
    proposalOutline = "border-dashed opacity-80";
  }

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[160px] max-w-[200px] cursor-pointer
        transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${style.bg} ${style.border}
        ${proposalOutline} ${opacity}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <span className={`text-sm font-semibold ${style.text}`}>{nodeData.label}</span>
      </div>

      {nodeData.estimatedDate && (
        <p className="text-xs text-muted-foreground">{nodeData.estimatedDate}</p>
      )}

      {(nodeData.isProposed || nodeData.isProposalAdd) && (
        <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block">
          proposed
        </span>
      )}

      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

export const gpsNodeTypes = {
  gpsNode: GpsNodeComponent,
};
