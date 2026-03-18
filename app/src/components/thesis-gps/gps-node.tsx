"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GpsNodeState } from "@/types/gps";

const STATE_STYLES: Record<GpsNodeState, { bg: string; border: string; text: string; pulse?: boolean }> = {
  completed: { bg: "#22c55e", border: "#16a34a", text: "#fff" },
  active: { bg: "#3b82f6", border: "#2563eb", text: "#fff", pulse: true },
  upcoming: { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
  blocked: { bg: "#ef4444", border: "#dc2626", text: "#fff" },
};

export interface GpsNodeData {
  label: string;
  state: GpsNodeState;
  description?: string;
  subtasks?: string[];
  isProposalAdd?: boolean;
  isProposalRemove?: boolean;
  isProposalUpdate?: boolean;
}

export function GpsNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as GpsNodeData;
  const style = STATE_STYLES[nodeData.state] ?? STATE_STYLES.upcoming;

  let opacity = 1;
  let outline = "none";
  if (nodeData.isProposalRemove) {
    opacity = 0.4;
    outline = "2px dashed #ef4444";
  } else if (nodeData.isProposalAdd) {
    outline = "2px dashed #22c55e";
  } else if (nodeData.isProposalUpdate) {
    outline = "2px dashed #f59e0b";
  }

  return (
    <div
      style={{
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: "10px",
        padding: "10px 16px",
        color: style.text,
        minWidth: 140,
        maxWidth: 200,
        textAlign: "center",
        opacity,
        outline,
        outlineOffset: "3px",
        boxShadow: style.pulse ? `0 0 0 4px ${style.bg}33` : undefined,
      }}
      className={style.pulse ? "animate-pulse" : ""}
    >
      <Handle type="target" position={Position.Left} style={{ background: style.border }} />
      <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: nodeData.description ? 4 : 0 }}>
        {nodeData.label}
      </div>
      {nodeData.description && (
        <div style={{ fontSize: "11px", opacity: 0.85 }}>{nodeData.description}</div>
      )}
      {nodeData.subtasks && nodeData.subtasks.length > 0 && (
        <div style={{ fontSize: "10px", opacity: 0.7, marginTop: 4, textAlign: "left" }}>
          {nodeData.subtasks.map((t, i) => (
            <div key={i}>• {t}</div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: style.border }} />
    </div>
  );
}

export const gpsNodeTypes = {
  gpsNode: GpsNodeComponent,
};
