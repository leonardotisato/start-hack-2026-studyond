"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThesisGpsView } from "@/components/thesis-gps/thesis-gps-view";
import { TaskBoard } from "@/components/planner/task-board";
import { CalendarView } from "@/components/planner/calendar-view";
import { MilestoneTracker } from "@/components/planner/milestone-tracker";
import type { GpsGraph } from "@/types/gps";
import type { ChatMessage } from "@/components/thesis-gps/gps-chat-panel";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface WorkspaceTask {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  nodeId?: string;
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
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_TASKS: WorkspaceTask[] = [
  { id: "t1", title: "Define research question", description: "Clearly formulate the main research question and sub-questions for your thesis.", status: "done" },
  { id: "t2", title: "Literature review outline", description: "Create an outline of key themes and papers for the literature review chapter.", status: "done" },
  { id: "t3", title: "Set up data pipeline", description: "Configure data collection tools and establish the processing pipeline.", status: "in_progress" },
  { id: "t4", title: "Run baseline experiments", description: "Execute initial experiments to establish baseline measurements.", status: "in_progress" },
  { id: "t5", title: "Write methodology chapter", description: "Document the research methodology, including approach, tools, and validation strategy.", status: "todo" },
  { id: "t6", title: "Supervisor meeting prep", description: "Prepare slides and questions for the next supervisor meeting.", status: "todo" },
  { id: "t7", title: "Analyze experiment results", description: "Statistical analysis of experiment data and visualization of key findings.", status: "todo" },
  { id: "t8", title: "Draft introduction", description: "Write the introduction chapter covering background, motivation, and thesis structure.", status: "todo" },
];

const DEFAULT_EVENTS: WorkspaceEvent[] = [
  { id: "ev1", date: "2026-03-20", label: "Supervisor meeting", type: "meeting" },
  { id: "ev2", date: "2026-03-25", label: "Literature review due", type: "deadline" },
  { id: "ev3", date: "2026-04-01", label: "Methodology draft", type: "milestone" },
  { id: "ev4", date: "2026-04-10", label: "Data collection start", type: "milestone" },
  { id: "ev5", date: "2026-04-15", label: "Supervisor meeting", type: "meeting" },
  { id: "ev6", date: "2026-04-30", label: "Mid-point check-in", type: "deadline" },
  { id: "ev7", date: "2026-05-15", label: "Analysis complete", type: "milestone" },
  { id: "ev8", date: "2026-05-20", label: "Supervisor meeting", type: "meeting" },
  { id: "ev9", date: "2026-06-01", label: "First draft deadline", type: "deadline" },
  { id: "ev10", date: "2026-06-15", label: "Final submission", type: "deadline" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface WorkspaceViewProps {
  projectId: string;
}

export function WorkspaceView({ projectId }: WorkspaceViewProps) {
  const [loaded, setLoaded] = useState(false);
  const [graph, setGraph] = useState<GpsGraph | null>(null);
  const [tasks, setTasks] = useState<WorkspaceTask[]>(DEFAULT_TASKS);
  const [events, setEvents] = useState<WorkspaceEvent[]>(DEFAULT_EVENTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [completedSubtasks, setCompletedSubtasks] = useState<Record<string, number[]>>({});

  // --- Load from localStorage on mount ---
  useEffect(() => {
    setGraph(load<GpsGraph | null>("graph", null));
    setTasks(load("tasks", DEFAULT_TASKS));
    setEvents(load("events", DEFAULT_EVENTS));
    setMessages(load("messages", []));
    setCompletedSubtasks(load("subtasks", {}));
    setLoaded(true);
  }, []);

  // --- Persist each piece of state ---
  useEffect(() => { if (loaded) save("graph", graph); }, [graph, loaded]);
  useEffect(() => { if (loaded) save("tasks", tasks); }, [tasks, loaded]);
  useEffect(() => { if (loaded) save("events", events); }, [events, loaded]);
  useEffect(() => { if (loaded) save("messages", messages); }, [messages, loaded]);
  useEffect(() => { if (loaded) save("subtasks", completedSubtasks); }, [completedSubtasks, loaded]);

  const handleGraphChange = useCallback((g: GpsGraph | null) => setGraph(g), []);

  const handleToggleSubtask = useCallback((nodeId: string, index: number) => {
    setCompletedSubtasks((prev) => {
      const current = prev[nodeId] ?? [];
      const next = current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index];
      return { ...prev, [nodeId]: next };
    });
  }, []);

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
          <TabsTrigger>GPS Graph</TabsTrigger>
          <TabsTrigger>Task Board</TabsTrigger>
          <TabsTrigger>Calendar</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4">
          <ThesisGpsView
            projectId={projectId}
            graph={graph}
            onGraphChange={handleGraphChange}
            messages={messages}
            onMessagesChange={setMessages}
            completedSubtasks={completedSubtasks}
            onToggleSubtask={handleToggleSubtask}
          />
        </TabsContent>

        <TabsContent className="mt-4">
          <TaskBoard
            tasks={tasks}
            onTasksChange={setTasks}
          />
        </TabsContent>

        <TabsContent className="mt-4">
          <CalendarView
            events={events}
            onEventsChange={setEvents}
          />
        </TabsContent>
      </Tabs>

      <MilestoneTracker
        graph={graph}
        onGraphChange={handleGraphChange}
      />
    </div>
  );
}
