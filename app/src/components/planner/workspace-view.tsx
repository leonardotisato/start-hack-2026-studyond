"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThesisGpsView } from "@/components/thesis-gps/thesis-gps-view";
import { TaskBoard } from "@/components/planner/task-board";
import { CalendarView } from "@/components/planner/calendar-view";
import { MilestoneTracker } from "@/components/planner/milestone-tracker";
import type { GpsGraph, ScoutMessage } from "@/types/gps";
import type { ChatMessage } from "@/components/thesis-gps/gps-chat-panel";
import { ConfettiCanvas, fireConfetti } from "@/components/ui/confetti";
import { DEFAULT_GRAPH, DEFAULT_COMPLETED_SUBTASKS } from "@/lib/gps-defaults";
import {
  computeNodeStates,
  chooseBranch,
  topologicalSortNodes,
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
/*  Derive tasks from graph                                            */
/* ------------------------------------------------------------------ */

function deriveTasksFromGraph(
  graph: GpsGraph,
  completedSubtasks: Record<string, number[]>,
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
  completedSubtasks: Record<string, number[]>,
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
  studentName?: string;
  projectTitle?: string;
}

// --- Session storage helpers (persist across navigation, reset on app restart) ---
const STORAGE_KEYS = {
  graph: "gps-graph",
  subtasks: "gps-subtasks",
  events: "gps-events",
  messages: "gps-messages",
  scoutConversations: "gps-scout-conversations",
} as const;

function loadSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function WorkspaceView({
  projectId,
  studentName,
  projectTitle,
}: WorkspaceViewProps) {
  const [graph, setGraph] = useState<GpsGraph>(() =>
    loadSession(STORAGE_KEYS.graph, DEFAULT_GRAPH),
  );
  const [completedSubtasks, setCompletedSubtasks] = useState<
    Record<string, number[]>
  >(() => loadSession(STORAGE_KEYS.subtasks, DEFAULT_COMPLETED_SUBTASKS));
  const [manualEvents, setManualEvents] = useState<WorkspaceEvent[]>(() =>
    loadSession(STORAGE_KEYS.events, []),
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadSession(STORAGE_KEYS.messages, []),
  );
  const [scoutConversations, setScoutConversations] = useState<
    Record<string, ScoutMessage[]>
  >(() => loadSession(STORAGE_KEYS.scoutConversations, {}));
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  // --- Persist to sessionStorage on changes ---
  useEffect(() => {
    saveSession(STORAGE_KEYS.graph, graph);
  }, [graph]);
  useEffect(() => {
    saveSession(STORAGE_KEYS.subtasks, completedSubtasks);
  }, [completedSubtasks]);
  useEffect(() => {
    saveSession(STORAGE_KEYS.events, manualEvents);
  }, [manualEvents]);
  useEffect(() => {
    saveSession(STORAGE_KEYS.messages, messages);
  }, [messages]);
  useEffect(() => {
    saveSession(STORAGE_KEYS.scoutConversations, scoutConversations);
  }, [scoutConversations]);

  // --- Toggle subtask ---
  const handleToggleSubtask = useCallback((nodeId: string, index: number) => {
    setCompletedSubtasks((prev) => {
      const current = prev[nodeId] ?? [];
      const isChecking = !current.includes(index);
      const next = isChecking
        ? [...current, index]
        : current.filter((i) => i !== index);
      if (isChecking) fireConfetti();
      return { ...prev, [nodeId]: next };
    });
  }, []);

  // --- Complete subtasks (from agent) ---
  const handleCompleteSubtasks = useCallback(
    (completions: Record<string, number[]>) => {
      setCompletedSubtasks((prev) => {
        const next = { ...prev };
        for (const [nodeId, indices] of Object.entries(completions)) {
          const existing = new Set(prev[nodeId] ?? []);
          for (const idx of indices) existing.add(idx);
          next[nodeId] = [...existing];
        }
        return next;
      });
    },
    [],
  );

  // --- Choose branch ---
  const handleChooseBranch = useCallback((chosenNodeId: string) => {
    setGraph((prev) => chooseBranch(prev, chosenNodeId));
  }, []);

  // --- Graph change (from agent proposals) ---
  const handleGraphChange = useCallback(
    (newGraph: GpsGraph, addedNodeIds?: string[]) => {
      setGraph(newGraph);
      if (addedNodeIds && addedNodeIds.length > 0) {
        setRecentlyAdded(new Set(addedNodeIds));
        // Clear highlight after 5 seconds
        setTimeout(() => setRecentlyAdded(new Set()), 5000);
      }
    },
    [],
  );

  // --- Derived data ---
  const graphTasks = useMemo(
    () => deriveTasksFromGraph(graph, completedSubtasks),
    [graph, completedSubtasks],
  );

  const graphEvents = useMemo(
    () => deriveEventsFromGraph(graph, completedSubtasks),
    [graph, completedSubtasks],
  );

  const allEvents = useMemo(
    () => [...graphEvents, ...manualEvents],
    [graphEvents, manualEvents],
  );

  const computedNodes = useMemo(
    () => computeNodeStates(graph, completedSubtasks),
    [graph, completedSubtasks],
  );

  // Milestones sorted in topological (graph) order
  const sortedNodes = useMemo(
    () => topologicalSortNodes(computedNodes, graph.edges),
    [computedNodes, graph.edges],
  );

  // Overall progress: completed subtasks / total subtasks across all nodes
  const { totalDone, totalSubtasks } = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const node of graph.nodes) {
      const count = node.subtasks?.length ?? 0;
      total += count;
      done += Math.min((completedSubtasks[node.id] ?? []).length, count);
    }
    return { totalDone: done, totalSubtasks: total };
  }, [graph.nodes, completedSubtasks]);

  const progressPercent =
    totalSubtasks > 0 ? Math.round((totalDone / totalSubtasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <ConfettiCanvas />
      {/* Header: title + progress bar */}
      <div className="flex items-center justify-between gap-6">
        <div className="shrink-0">
          <h1 className="text-3xl font-bold leading-tight">Thesis Workspace</h1>
          {(studentName || projectTitle) && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {studentName}
              {studentName && projectTitle ? " \u2014 " : ""}
              {projectTitle}
            </p>
          )}
        </div>
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Overall progress
            </span>
            <span className="text-xs font-semibold tabular-nums">
              {progressPercent}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background:
                  "linear-gradient(to right, #6366f1, #8b5cf6, #a855f7)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalDone} of {totalSubtasks} tasks completed
          </p>
        </div>
      </div>

      {/* GPS Graph */}
      <ThesisGpsView
        projectId={projectId}
        graph={graph}
        onGraphChange={handleGraphChange}
        completedSubtasks={completedSubtasks}
        onToggleSubtask={handleToggleSubtask}
        onCompleteSubtasks={handleCompleteSubtasks}
        onChooseBranch={handleChooseBranch}
        messages={messages}
        onMessagesChange={setMessages}
        recentlyAdded={recentlyAdded}
        scoutConversations={scoutConversations}
        onScoutConversationsChange={setScoutConversations}
      />

      {/* Task Board */}
      <TaskBoard tasks={graphTasks} onToggleSubtask={handleToggleSubtask} />

      {/* Calendar */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            events={allEvents}
            onEventsChange={setManualEvents}
            graphEventIds={new Set(graphEvents.map((e) => e.id))}
          />
        </TabsContent>
      </Tabs>

      <MilestoneTracker
        nodes={sortedNodes}
        completedSubtasks={completedSubtasks}
        recentlyAdded={recentlyAdded}
        manualEvents={manualEvents}
      />
    </div>
  );
}
