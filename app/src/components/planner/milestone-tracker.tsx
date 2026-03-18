"use client";

import type { ThesisProject } from "@/types";

interface Milestone {
  label: string;
  date: string;
  done: boolean;
}

function getMilestones(project: ThesisProject): Milestone[] {
  const created = new Date(project.createdAt);
  const milestones: Milestone[] = [
    {
      label: "Topic Selected",
      date: formatDate(created),
      done: ["applied", "agreed", "in_progress", "completed"].includes(project.state),
    },
    {
      label: "Proposal Submitted",
      date: formatDate(addDays(created, 21)),
      done: ["agreed", "in_progress", "completed"].includes(project.state),
    },
    {
      label: "Literature Review Complete",
      date: formatDate(addDays(created, 56)),
      done: ["in_progress", "completed"].includes(project.state),
    },
    {
      label: "Data Collection Done",
      date: formatDate(addDays(created, 98)),
      done: project.state === "completed",
    },
    {
      label: "First Draft",
      date: formatDate(addDays(created, 133)),
      done: project.state === "completed",
    },
    {
      label: "Final Submission",
      date: formatDate(addDays(created, 168)),
      done: project.state === "completed",
    },
  ];
  return milestones;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CH", { month: "short", day: "numeric", year: "numeric" });
}

interface MilestoneTrackerProps {
  projects: ThesisProject[];
}

export function MilestoneTracker({ projects }: MilestoneTrackerProps) {
  const activeProject =
    projects.find((p) => p.state === "in_progress") ??
    projects.find((p) => p.state === "agreed") ??
    projects[0];

  if (!activeProject) {
    return <p className="text-sm text-muted-foreground">No projects found.</p>;
  }

  const milestones = getMilestones(activeProject);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{activeProject.title}</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              <div
                className="h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10"
                style={{
                  background: m.done ? "#22c55e" : "#f3f4f6",
                  borderColor: m.done ? "#16a34a" : "#d1d5db",
                }}
              >
                {m.done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${m.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{m.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
