import { getProjects, getStudents } from "@/lib/data";
import { WorkspaceView } from "@/components/planner/workspace-view";

export default async function PlannerPage() {
  const [projects, students] = await Promise.all([getProjects(), getStudents()]);
  const activeProject =
    projects.find((p) => p.state === "in_progress") ??
    projects.find((p) => p.state === "agreed") ??
    projects[0];

  const student = students.find((s) => s.id === activeProject.studentId);

  return (
    <main className="container mx-auto max-w-7xl py-6 px-4">
      <h1 className="text-3xl font-bold mb-1">Thesis Workspace</h1>
      <p className="text-muted-foreground mb-6">
        {student?.firstName} {student?.lastName} &mdash; {activeProject.title}
      </p>
      <WorkspaceView projectId={activeProject.id} />
    </main>
  );
}
