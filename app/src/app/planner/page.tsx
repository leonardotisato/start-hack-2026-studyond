import { getProjects } from "@/lib/data";
import { TaskBoard } from "@/components/planner/task-board";
import { MilestoneTracker } from "@/components/planner/milestone-tracker";
import { CalendarView } from "@/components/planner/calendar-view";

export default async function PlannerPage() {
  const projects = await getProjects();

  return (
    <main className="container mx-auto max-w-7xl py-10 px-4 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Shared Planning Space</h1>
        <p className="text-muted-foreground">
          Collaborative workspace for teams and thesis milestone tracking.
        </p>
      </div>

      {/* Task Board */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Task Board</h2>
        <TaskBoard />
      </section>

      {/* Bottom row: Milestone Tracker + Calendar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Milestone Tracker</h2>
          <MilestoneTracker projects={projects} />
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <CalendarView />
        </section>
      </div>
    </main>
  );
}
