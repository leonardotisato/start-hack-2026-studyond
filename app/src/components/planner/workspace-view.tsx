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
  const [graph, setGraph] = useState<GpsGraph>(DEFAULT_GRAPH);
  const [completedSubtasks, setCompletedSubtasks] = useState<Record<string, number[]>>(
    DEFAULT_COMPLETED_SUBTASKS
  );
  const [manualEvents, setManualEvents] = useState<WorkspaceEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  // --- Always reset to defaults on mount (fresh start every time) ---
  useEffect(() => {
    setGraph(DEFAULT_GRAPH);
    setCompletedSubtasks(DEFAULT_COMPLETED_SUBTASKS);
    setManualEvents([]);
    setMessages([]);
    setRecentlyAdded(new Set());
  }, []);

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
  const handleChooseBranch = useCallback((chosenNodeId: string) => {
    setGraph((prev) => chooseBranch(prev, chosenNodeId));
  }, []);

  // --- Graph change (from agent proposals) ---
  const handleGraphChange = useCallback((newGraph: GpsGraph, addedNodeIds?: string[]) => {
    setGraph(newGraph);
    if (addedNodeIds && addedNodeIds.length > 0) {
      setRecentlyAdded(new Set(addedNodeIds));
      // Clear highlight after 5 seconds
      setTimeout(() => setRecentlyAdded(new Set()), 5000);
    }
  }, []);

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

  // Milestones sorted in topological (graph) order
  const sortedNodes = useMemo(
    () => topologicalSortNodes(computedNodes, graph.edges),
    [computedNodes, graph.edges]
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="gps">
        <TabsList>
          <TabsTrigger value="gps">GPS Graph</TabsTrigger>
          <TabsTrigger value="tasks">Task Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="gps" className="mt-4">
          <ThesisGpsView
            projectId={projectId}
            graph={graph}
            onGraphChange={handleGraphChange}
            completedSubtasks={completedSubtasks}
            onToggleSubtask={handleToggleSubtask}
            onChooseBranch={handleChooseBranch}
            messages={messages}
            onMessagesChange={setMessages}
            recentlyAdded={recentlyAdded}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <TaskBoard
            tasks={graphTasks}
            onToggleSubtask={handleToggleSubtask}
          />
        </TabsContent>

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
