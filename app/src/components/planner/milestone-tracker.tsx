"use client";

import { useState } from "react";
import type { GpsNode } from "@/types/gps";

interface MilestoneTrackerProps {
  nodes: GpsNode[];
  completedSubtasks: Record<string, number[]>;
}

type ViewMode = "milestones" | "deadlines";

export function MilestoneTracker({ nodes, completedSubtasks }: MilestoneTrackerProps) {
  const [mode, setMode] = useState<ViewMode>("milestones");

  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">No milestones yet.</p>
      </div>
    );
  }

  const deadlines = nodes
    .filter((n) => n.estimatedDate)
    .sort((a, b) => (a.estimatedDate! > b.estimatedDate! ? 1 : -1));

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {mode === "milestones" ? "Milestones" : "Deadlines"}
        </h3>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ViewMode)}
          className="text-xs rounded-md border bg-background px-2 py-1 outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="milestones">Milestones</option>
          <option value="deadlines">Deadlines</option>
        </select>
      </div>

      {mode === "milestones" ? (
        <MilestoneList nodes={nodes} completedSubtasks={completedSubtasks} />
      ) : (
        <DeadlineList nodes={deadlines} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Milestone view                                                     */
/* ------------------------------------------------------------------ */

function MilestoneList({
  nodes,
  completedSubtasks,
}: {
  nodes: GpsNode[];
  completedSubtasks: Record<string, number[]>;
}) {
  return (
    <div className="relative">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-3">
        {nodes.map((node) => {
          const isDone = node.state === "completed";
          const isActive = node.state === "active";
          const isBlocked = node.state === "blocked";
          const total = node.subtasks?.length ?? 0;
          const done = (completedSubtasks[node.id] ?? []).length;

          return (
            <div key={node.id} className="flex items-start gap-3 relative">
              <div
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-600"
                    : isActive
                      ? "bg-blue-500 border-blue-600 animate-pulse"
                      : isBlocked
                        ? "bg-red-500 border-red-600"
                        : "bg-gray-100 border-gray-300"
                }`}
              >
                {isDone && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isActive && !isDone && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isDone
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {node.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {total > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {done}/{total}
                      </span>
                    )}
                    {node.estimatedDate && (
                      <span className="text-xs text-muted-foreground">
                        {node.estimatedDate}
                      </span>
                    )}
                  </div>
                </div>
                {/* Mini progress bar */}
                {total > 0 && (
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? "bg-emerald-500" : isActive ? "bg-blue-500" : "bg-gray-300"
                      }`}
                      style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                    />
                  </div>
                )}
                {node.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {node.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Deadline view                                                      */
/* ------------------------------------------------------------------ */

function DeadlineList({ nodes }: { nodes: GpsNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No deadlines set.
      </p>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-2">
      {nodes.map((node) => {
        const isPast = node.estimatedDate! < today;
        const isDone = node.state === "completed";
        const isOverdue = isPast && !isDone;

        return (
          <div
            key={node.id}
            className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
              isOverdue
                ? "border-red-300 bg-red-50"
                : isDone
                  ? "opacity-60"
                  : ""
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full shrink-0 ${
                isOverdue
                  ? "bg-red-500"
                  : isDone
                    ? "bg-emerald-500"
                    : "bg-amber-500"
              }`}
            />
            <span
              className={`flex-1 ${
                isDone ? "line-through text-muted-foreground" : ""
              }`}
            >
              {node.label}
            </span>
            <span
              className={`text-xs ${
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              }`}
            >
              {node.estimatedDate}
              {isOverdue && " (overdue)"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
