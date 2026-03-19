"use client";

import { Badge } from "@/components/ui/badge";
import type { WorkspaceTask } from "./workspace-view";

type TaskStatus = WorkspaceTask["status"];

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "Upcoming", color: "#6b7280" },
  { key: "in_progress", label: "Active", color: "#3b82f6" },
  { key: "done", label: "Completed", color: "#22c55e" },
];

interface TaskBoardProps {
  tasks: WorkspaceTask[];
  onToggleSubtask: (nodeId: string, subtaskIndex: number) => void;
}

export function TaskBoard({ tasks, onToggleSubtask }: TaskBoardProps) {
  function handleToggle(task: WorkspaceTask) {
    if (task.nodeId == null || task.subtaskIndex == null) return;
    // Only allow toggling active/done tasks (not upcoming/locked)
    if (task.status === "todo") return;
    onToggleSubtask(task.nodeId, task.subtaskIndex);
  }

  return (
    <div className="space-y-4">
      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="rounded-lg border bg-muted/30 p-3 min-h-[200px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: col.color }}
                />
                <h4 className="text-sm font-semibold">{col.label}</h4>
                <span className="ml-auto text-xs text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {colTasks.map((task) => {
                  const isLocked = task.status === "todo";
                  const isDone = task.status === "done";

                  return (
                    <div
                      key={task.id}
                      className={`rounded-md border bg-card p-3 text-sm transition ${
                        isLocked ? "opacity-50" : "hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggle(task)}
                          disabled={isLocked}
                          className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition ${
                            isDone
                              ? "bg-emerald-500 border-emerald-600 text-white cursor-pointer"
                              : isLocked
                                ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                                : "border-gray-300 hover:border-gray-400 cursor-pointer"
                          }`}
                        >
                          {isDone && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`block ${
                              isDone
                                ? "line-through text-muted-foreground"
                                : isLocked
                                  ? "text-muted-foreground"
                                  : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground truncate block">
                            {task.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No tasks
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
