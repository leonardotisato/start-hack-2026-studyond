"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceTask } from "./workspace-view";

type TaskStatus = WorkspaceTask["status"];

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "#6b7280" },
  { key: "in_progress", label: "In Progress", color: "#3b82f6" },
  { key: "done", label: "Done", color: "#22c55e" },
];

const STATUS_BADGE: Record<TaskStatus, { label: string; variant: "outline" | "secondary" | "default" }> = {
  todo: { label: "To Do", variant: "outline" },
  in_progress: { label: "In Progress", variant: "secondary" },
  done: { label: "Done", variant: "default" },
};

interface TaskBoardProps {
  tasks: WorkspaceTask[];
  onTasksChange: React.Dispatch<React.SetStateAction<WorkspaceTask[]>>;
}

export function TaskBoard({ tasks, onTasksChange }: TaskBoardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    onTasksChange((prev) => [
      ...prev,
      { id: `t${Date.now()}`, title, description: newTaskDesc.trim(), status: "todo" as const },
    ]);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setShowAddForm(false);
  }

  function toggleTaskDone(taskId: string) {
    onTasksChange((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, status: t.status === "done" ? "todo" as const : "done" as const };
      })
    );
  }

  function onDragStart(id: string) {
    setDraggedId(id);
  }

  function onDrop(status: TaskStatus) {
    if (!draggedId) return;
    onTasksChange((prev) =>
      prev.map((t) => (t.id === draggedId ? { ...t, status } : t))
    );
    setDraggedId(null);
  }

  function deleteTask(id: string) {
    onTasksChange((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
  }

  return (
    <div className="space-y-4">
      {/* Add task */}
      {!showAddForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
          + Add Task
        </Button>
      ) : (
        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Task title..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <textarea
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addTask} disabled={!newTaskTitle.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewTaskTitle(""); setNewTaskDesc(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="rounded-lg border bg-muted/30 p-3 min-h-[200px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.key)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
              <h4 className="text-sm font-semibold">{col.label}</h4>
              <span className="ml-auto text-xs text-muted-foreground">
                {tasks.filter((t) => t.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === col.key)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => onDragStart(task.id)}
                    className="rounded-md border bg-card p-3 text-sm cursor-grab active:cursor-grabbing hover:shadow-sm transition group"
                  >
                    <div className="flex items-start gap-2">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTaskDone(task.id); }}
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition ${
                          task.status === "done"
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {task.status === "done" && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      {/* Title (clickable to open detail) */}
                      <button
                        onClick={() => setSelectedTask(task)}
                        className={`flex-1 text-left hover:underline ${
                          task.status === "done" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task detail dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.description || "No description provided."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={STATUS_BADGE[selectedTask?.status ?? "todo"].variant}>
              {STATUS_BADGE[selectedTask?.status ?? "todo"].label}
            </Badge>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTask && toggleTaskDone(selectedTask.id)}
            >
              {selectedTask?.status === "done" ? "Mark Incomplete" : "Mark Complete"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedTask && deleteTask(selectedTask.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
