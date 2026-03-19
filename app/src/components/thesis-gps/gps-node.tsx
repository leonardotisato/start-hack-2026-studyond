"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GpsNodeState } from "@/types/gps";

export interface GpsNodeData {
  label: string;
  state: GpsNodeState;
  description?: string;
  estimatedDate?: string;
  subtasks?: string[];
  progress: number; // 0-1 fraction
  progressLabel?: string; // e.g. "3/5"
  isBranch: boolean;
  isProposalAdd?: boolean;
  isProposalRemove?: boolean;
  isProposalUpdate?: boolean;
  isRecentlyAdded?: boolean;
  [key: string]: unknown;
}

const STATE_STYLES: Record<
  GpsNodeState,
  { bg: string; border: string; text: string; dot: string; bar: string }
> = {
  completed: {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  active: {
    bg: "bg-blue-50",
    border: "border-blue-500 shadow-md shadow-blue-200",
    text: "text-blue-800",
    dot: "bg-blue-500 animate-pulse",
    bar: "bg-blue-500",
  },
  upcoming: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-400",
    dot: "bg-gray-300",
    bar: "bg-gray-300",
  },
  blocked: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-700",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
};

export function GpsNodeComponent({ data }: NodeProps) {
  const d = data as GpsNodeData;
  const style = STATE_STYLES[d.state] ?? STATE_STYLES.upcoming;
  const isLocked = d.state === "upcoming" || d.state === "blocked";

  let proposalOutline = "";
  let proposalOpacity = "";
  if (d.isProposalRemove) {
    proposalOutline = "outline outline-2 outline-red-500 outline-dashed";
    proposalOpacity = "opacity-40";
  } else if (d.isProposalAdd) {
    proposalOutline = "outline outline-2 outline-green-500 outline-dashed";
  } else if (d.isProposalUpdate) {
    proposalOutline = "outline outline-2 outline-amber-500 outline-dashed";
  }

  const recentHighlight = d.isRecentlyAdded
    ? "ring-2 ring-violet-500 ring-offset-2 bg-violet-50 shadow-lg shadow-violet-200"
    : "";

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[180px] max-w-[220px]
        transition-all duration-200
        ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-105 hover:shadow-lg"}
        ${style.bg} ${style.border}
        ${proposalOutline} ${proposalOpacity} ${recentHighlight}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-1">
        {d.state === "completed" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : isLocked ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        )}
        <span className={`text-sm font-semibold leading-tight ${style.text}`}>
          {d.label}
        </span>
      </div>

      {d.isBranch && d.state === "active" && (
        <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded inline-block mb-1">
          choose path
        </span>
      )}

      {d.estimatedDate && (
        <p className="text-[11px] text-muted-foreground mb-1">{d.estimatedDate}</p>
      )}

      {/* Progress bar */}
      {d.progressLabel && (
        <div className="mt-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">{d.progressLabel}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
              style={{ width: `${Math.round(d.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

export const gpsNodeTypes = {
  gpsNode: GpsNodeComponent,
};
