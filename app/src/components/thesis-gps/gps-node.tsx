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
      <Handle type="source" position={Position.Bottom} id="scout-source" className="!bg-violet-400 !w-2 !h-2" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scout result node (recommendation)                                 */
/* ------------------------------------------------------------------ */

export interface ScoutNodeData {
  name: string;
  title: string;
  affiliation: string;
  email: string;
  type: string; // "supervisor" | "expert" | "company" | "topic"
  matchScore: number;
  fieldNames: string[];
  onDismiss?: () => void;
  [key: string]: unknown;
}

const SCOUT_TYPE_CONFIG: Record<string, { icon: string; bg: string; border: string }> = {
  supervisor: { icon: "🎓", bg: "bg-blue-50", border: "border-blue-400" },
  expert: { icon: "💼", bg: "bg-indigo-50", border: "border-indigo-400" },
  company: { icon: "🏢", bg: "bg-green-50", border: "border-green-400" },
  topic: { icon: "📄", bg: "bg-violet-50", border: "border-violet-400" },
  university: { icon: "🏛️", bg: "bg-amber-50", border: "border-amber-400" },
  program: { icon: "📚", bg: "bg-teal-50", border: "border-teal-400" },
};

export function ScoutResultNodeComponent({ data }: NodeProps) {
  const d = data as ScoutNodeData;
  const config = SCOUT_TYPE_CONFIG[d.type] ?? SCOUT_TYPE_CONFIG.expert;
  const matchPercent = Math.round(d.matchScore * 100);

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[200px] max-w-[240px] ${config.bg} ${config.border} shadow-md cursor-pointer hover:scale-105 transition-all duration-200`}>
      <Handle type="target" position={Position.Top} id="scout-target" className="!bg-violet-400 !w-2 !h-2" />

      <div className="flex items-start gap-2 mb-1.5">
        <span className="text-lg shrink-0">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{d.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{d.title}</p>
        </div>
        {d.onDismiss && (
          <button
            onClick={(e) => { e.stopPropagation(); d.onDismiss!(); }}
            className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
            title="Hide contact"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mb-1.5">{d.affiliation}</p>

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex flex-wrap gap-1">
          {d.fieldNames.slice(0, 2).map((f) => (
            <span key={f} className="rounded-full bg-violet-100 border border-violet-200 text-violet-800 px-1.5 py-0.5 text-[9px]">{f}</span>
          ))}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{matchPercent}%</span>
      </div>

      {d.email && (
        <a
          href={`mailto:${d.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1 rounded-md bg-violet-600 text-white px-2 py-1 text-[11px] font-medium hover:bg-violet-700 transition w-full"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Contact
        </a>
      )}

    </div>
  );
}

export const gpsNodeTypes = {
  gpsNode: GpsNodeComponent,
  scoutResult: ScoutResultNodeComponent,
};
