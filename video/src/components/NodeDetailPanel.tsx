import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { geist } from "../utils/fonts";

interface NodeDetailPanelProps {
  startFrame: number;
  label: string;
  status: "completed" | "active" | "upcoming" | "blocked";
  estimatedDate?: string;
  description?: string;
  subtasks?: string[];
  completedSubtaskIndices?: number[];
  checkSubtaskFrame?: number;
  checkSubtaskIndex?: number;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Completed", color: "#065F46", bg: "#DCFCE7" },
  active:    { label: "In Progress", color: "#1E40AF", bg: "#DBEAFE" },
  upcoming:  { label: "Locked", color: "#6B7280", bg: "#F3F4F6" },
  blocked:   { label: "Blocked", color: "#B91C1C", bg: "#FEE2E2" },
};

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  startFrame,
  label,
  status,
  estimatedDate,
  description,
  subtasks = [],
  completedSubtaskIndices = [],
  checkSubtaskFrame,
  checkSubtaskIndex,
}) => {
  const frame = useCurrentFrame();

  const slideIn = spring({
    frame: frame - startFrame,
    fps: 30,
    config: { mass: 0.5, damping: 14, stiffness: 180 },
    durationInFrames: 30,
  });

  const translateX = interpolate(slideIn, [0, 1], [40, 0]);
  const opacity = interpolate(slideIn, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  if (frame < startFrame) return null;

  const stateInfo = STATUS_INFO[status] ?? STATUS_INFO.upcoming;

  const checked = new Set(completedSubtaskIndices);
  if (checkSubtaskFrame !== undefined && checkSubtaskIndex !== undefined && frame >= checkSubtaskFrame) {
    checked.add(checkSubtaskIndex);
  }

  const done = checked.size;
  const total = subtasks.length;

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        top: 16,
        width: 280,
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        padding: 16,
        fontFamily: geist,
        zIndex: 100,
        transform: `translateX(${translateX}px)`,
        opacity,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.3, flex: 1, marginRight: 8 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>✕</div>
      </div>

      {/* Status badge + subtask count */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: stateInfo.color, background: stateInfo.bg,
          padding: "2px 8px", borderRadius: 4,
        }}>
          {stateInfo.label}
        </span>
        {total > 0 && (
          <span style={{ fontSize: 12, color: "#6B7280" }}>{done}/{total} subtasks</span>
        )}
      </div>

      {/* Due date */}
      {estimatedDate && (
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
          Due: {estimatedDate}
        </div>
      )}

      {/* Description */}
      {description && (
        <>
          <div style={{ height: 1, background: "#E5E7EB", margin: "10px 0" }} />
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, marginBottom: 8 }}>
            {description}
          </div>
        </>
      )}

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <>
          <div style={{ height: 1, background: "#E5E7EB", margin: "10px 0" }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Subtasks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {subtasks.map((task, i) => {
              const isDone = checked.has(i);
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${isDone ? "#10B981" : "#D1D5DB"}`,
                    background: isDone ? "#10B981" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: 12, lineHeight: 1.4,
                    color: isDone ? "#9CA3AF" : "#374151",
                    textDecoration: isDone ? "line-through" : "none",
                  }}>
                    {task}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
