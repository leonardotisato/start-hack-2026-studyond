"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThesisGpsView } from "@/components/thesis-gps/thesis-gps-view";
import { TaskBoard } from "@/components/planner/task-board";
import { CalendarView } from "@/components/planner/calendar-view";
import { MilestoneTracker } from "@/components/planner/milestone-tracker";
import type { GpsGraph } from "@/types/gps";
import type { ChatMessage } from "@/components/thesis-gps/gps-chat-panel";
import { DEFAULT_GRAPH, DEFAULT_COMPLETED_SUBTASKS } from "@/lib/gps-defaults";
import {
  computeNodeStates,
  chooseBranch,
} from "@/lib/gps-graph-utils";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface WorkspaceTask {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  nodeId?: string;
  subtaskIndex?: number;
}

export interface WorkspaceEvent {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  type: "milestone" | "meeting" | "deadline";
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const PREFIX = "studyond-ws-";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded – ignore */
  }
}

/* ------------------------------------------------------------------ */
/*  Derive tasks from graph                                            */
/* ------------------------------------------------------------------ */

function deriveTasksFromGraph(
  graph: GpsGraph,
  completedSubtasks: Record<string, number[]>
): WorkspaceTask[] {
  const computed = computeNodeStates(graph, completedSubtasks);
  const tasks: WorkspaceTask[] = [];

  for (const node of computed) {
    if (!node.subtasks) continue;
    for (let i = 0; i < node.subtasks.length; i++) {
      const isDone = (completedSubtasks[node.id] ?? []).includes(i);
      let status: WorkspaceTask["status"];
      if (isDone) {
        status = "done";
      } else if (node.state === "active") {
        status = "in_progress";
      } else {
        status = "todo";
      }

      tasks.push({
        id: `${node.id}--${i}`,
        title: node.subtasks[i],
        description: node.label,
        status,
        nodeId: node.id,
        subtaskIndex: i,
      });
    }
  }

  return tasks;
}

/* ------------------------------------------------------------------ */
/*  Derive calendar events from graph deadlines                        */
/* ------------------------------------------------------------------ */

function deriveEventsFromGraph(
  graph: GpsGraph,
  completedSubtasks: Record<string, number[]>
): WorkspaceEvent[] {
  const computed = computeNodeStates(graph, completedSubtasks);
  return computed
    .filter((n) => n.estimatedDate)
    .map((n) => ({
      id: `graph-${n.id}`,
      date: n.estimatedDate!,
      label: n.label,
      type: "deadline" as const,
    }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface WorkspaceViewProps {
  projectId: string;
}

export function WorkspaceView({ projectId }: WorkspaceViewProps) {
  const [loaded, setLoaded] = useState(false);
  const [graph, setGraph] = useState<GpsGraph>(DEFAULT_GRAPH);
  const [completedSubtasks, setCompletedSubtasks] = useState<Record<string, number[]>>(
    DEFAULT_COMPLETED_SUBTASKS
  );
  const [manualEvents, setManualEvents] = useState<WorkspaceEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // --- Load from localStorage on mount ---
  useEffect(() => {
    setGraph(load("graph2", DEFAULT_GRAPH));
    setCompletedSubtasks(load("subtasks2", DEFAULT_COMPLETED_SUBTASKS));
    setManualEvents(load("manualEvents", []));
    setMessages(load("messages2", []));
    setLoaded(true);
  }, []);

  // --- Persist state ---
  useEffect(() => {
    if (loaded) save("graph2", graph);
  }, [graph, loaded]);
  useEffect(() => {
    if (loaded) save("subtasks2", completedSubtasks);
  }, [completedSubtasks, loaded]);
  useEffect(() => {
    if (loaded) save("manualEvents", manualEvents);
  }, [manualEvents, loaded]);
  useEffect(() => {
    if (loaded) save("messages2", messages);
  }, [messages, loaded]);

  // --- Toggle subtask ---
  const handleToggleSubtask = useCallback((nodeId: string, index: number) => {
    setCompletedSubtasks((prev) => {
      const current = prev[nodeId] ?? [];
      const next = current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index];
      return { ...prev, [nodeId]: next };
    });
  }, []);

  // --- Choose branch ---
  const handleChooseBranch = useCallback(
    (chosenNodeId: string) => {
      setGraph((prev) => chooseBranch(prev, chosenNodeId));
    },
    []
  );

  // --- Derived data ---
  const graphTasks = useMemo(
    () => deriveTasksFromGraph(graph, completedSubtasks),
    [graph, completedSubtasks]
  );

  const graphEvents = useMemo(
    () => deriveEventsFromGraph(graph, completedSubtasks),
    [graph, completedSubtasks]
  );

  const allEvents = useMemo(
    () => [...graphEvents, ...manualEvents],
    [graphEvents, manualEvents]
  );

  const computedNodes = useMemo(
    () => computeNodeStates(graph, completedSubtasks),
    [graph, completedSubtasks]
  );

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>GPS Graph</TabsTrigger>
          <TabsTrigger value={1}>Task Board</TabsTrigger>
          <TabsTrigger value={2}>Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value={0} className="mt-4">
          <ThesisGpsView
            projectId={projectId}
            graph={graph}
            onGraphChange={setGraph}
            completedSubtasks={completedSubtasks}
            onToggleSubtask={handleToggleSubtask}
            onChooseBranch={handleChooseBranch}
            messages={messages}
            onMessagesChange={setMessages}
          />
        </TabsContent>

        <TabsContent value={1} className="mt-4">
          <TaskBoard
            tasks={graphTasks}
            onToggleSubtask={handleToggleSubtask}
          />
        </TabsContent>

        <TabsContent value={2} className="mt-4">
          <CalendarView
            events={allEvents}
            onEventsChange={setManualEvents}
            graphEventIds={new Set(graphEvents.map((e) => e.id))}
          />
        </TabsContent>
      </Tabs>

      <MilestoneTracker
        nodes={computedNodes}
        completedSubtasks={completedSubtasks}
      />
    </div>
  );
}
