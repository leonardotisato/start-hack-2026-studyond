"use client";

import { useState } from "react";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "#6b7280" },
  { key: "in_progress", label: "In Progress", color: "#3b82f6" },
  { key: "done", label: "Done", color: "#22c55e" },
];

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Define research question", status: "done" },
  { id: "t2", title: "Literature review outline", status: "done" },
  { id: "t3", title: "Set up data pipeline", status: "in_progress" },
  { id: "t4", title: "Run baseline experiments", status: "in_progress" },
  { id: "t5", title: "Write methodology chapter", status: "todo" },
  { id: "t6", title: "Supervisor meeting prep", status: "todo" },
  { id: "t7", title: "Analyze experiment results", status: "todo" },
  { id: "t8", title: "Draft introduction", status: "todo" },
];

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    setTasks((prev) => [...prev, { id: `t${Date.now()}`, title, status: "todo" }]);
    setNewTaskTitle("");
  }

  function onDragStart(id: string) {
    setDraggedId(id);
  }

  function onDrop(status: TaskStatus) {
    if (!draggedId) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedId ? { ...t, status } : t))
    );
    setDraggedId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={addTask}
          disabled={!newTaskTitle.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="rounded-lg border bg-muted/30 p-3 min-h-[200px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.key)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: col.color }}
              />
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
                    className="rounded-md border bg-card p-3 text-sm cursor-grab active:cursor-grabbing hover:shadow-sm transition"
                  >
                    {task.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
