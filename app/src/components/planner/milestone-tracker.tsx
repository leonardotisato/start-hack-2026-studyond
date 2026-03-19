"use client";

import { useState } from "react";
import type { GpsNode } from "@/types/gps";
import type { WorkspaceEvent } from "./workspace-view";

interface MilestoneTrackerProps {
  nodes: GpsNode[];
  completedSubtasks: Record<string, number[]>;
  recentlyAdded?: Set<string>;
  manualEvents?: WorkspaceEvent[];
}

type ViewMode = "milestones" | "deadlines";

/* ------------------------------------------------------------------ */
/*  Unified item type used by both views                               */
/* ------------------------------------------------------------------ */

interface TrackerItem {
  id: string;
  label: string;
  date: string | null;
  description?: string;
  state: "completed" | "active" | "upcoming" | "blocked";
  subtasksDone: number;
  subtasksTotal: number;
  isNew: boolean;
}

function buildItems(
  nodes: GpsNode[],
  completedSubtasks: Record<string, number[]>,
  manualEvents: WorkspaceEvent[],
  typeFilter: "milestone" | "deadline",
  recentlyAdded?: Set<string>
): TrackerItem[] {
  const graphItems: TrackerItem[] = nodes
    .filter((n) => (typeFilter === "deadline" ? !!n.estimatedDate : true))
    .map((node) => {
      const total = node.subtasks?.length ?? 0;
      const done = (completedSubtasks[node.id] ?? []).length;
      return {
        id: node.id,
        label: node.label,
        date: node.estimatedDate ?? null,
        description: node.description,
        state: node.state ?? "upcoming",
        subtasksDone: done,
        subtasksTotal: total,
        isNew: recentlyAdded?.has(node.id) ?? false,
      };
    });

  const manualItems: TrackerItem[] = manualEvents
    .filter((e) => e.type === typeFilter)
    .map((ev) => ({
      id: ev.id,
      label: ev.label,
      date: ev.date,
      state: "upcoming" as const,
      subtasksDone: 0,
      subtasksTotal: 0,
      isNew: false,
    }));

  // Merge and sort by date (items without dates go to the end)
  return [...graphItems, ...manualItems].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date > b.date ? 1 : -1;
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MilestoneTracker({ nodes, completedSubtasks, recentlyAdded, manualEvents = [] }: MilestoneTrackerProps) {
  const [mode, setMode] = useState<ViewMode>("milestones");

  const items = buildItems(nodes, completedSubtasks, manualEvents, mode === "milestones" ? "milestone" : "deadline", recentlyAdded);

  const hasContent = nodes.length > 0 || manualEvents.length > 0;

  if (!hasContent) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">No milestones yet.</p>
      </div>
    );
  }

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
        <MilestoneList items={items} />
      ) : (
        <DeadlineList items={items} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Milestone view                                                     */
/* ------------------------------------------------------------------ */

function MilestoneList({ items }: { items: TrackerItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No milestones yet.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-3">
        {items.map((item) => {
          const isDone = item.state === "completed";
          const isActive = item.state === "active";
          const isBlocked = item.state === "blocked";

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 relative ${
                item.isNew
                  ? "bg-violet-50 rounded-md px-2 py-1 ring-2 ring-violet-400 ring-offset-1 transition-all duration-500"
                  : ""
              }`}
            >
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
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.subtasksTotal > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {item.subtasksDone}/{item.subtasksTotal}
                      </span>
                    )}
                    {item.date && (
                      <span className="text-xs text-muted-foreground">
                        {item.date}
                      </span>
                    )}
                  </div>
                </div>
                {/* Mini progress bar */}
                {item.subtasksTotal > 0 && (
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? "bg-emerald-500" : isActive ? "bg-blue-500" : "bg-gray-300"
                      }`}
                      style={{ width: `${(item.subtasksDone / item.subtasksTotal) * 100}%` }}
                    />
                  </div>
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.description}
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

function DeadlineList({ items }: { items: TrackerItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No deadlines set.
      </p>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isPast = !!item.date && item.date < today;
        const isDone = item.state === "completed";
        const isOverdue = isPast && !isDone;

        return (
          <div
            key={item.id}
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
              {item.label}
            </span>
            <span
              className={`text-xs ${
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              }`}
            >
              {item.date}
              {isOverdue && " (overdue)"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
