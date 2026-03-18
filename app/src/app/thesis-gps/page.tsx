import { getProjects, getStudents } from "@/lib/data";
import { ThesisGpsView } from "@/components/thesis-gps/thesis-gps-view";

export default async function ThesisGpsPage() {
  const [projects, students] = await Promise.all([getProjects(), getStudents()]);

  // Demo: pick a project that is in_progress
  const activeProject = projects.find((p) => p.state === "in_progress") ?? projects[0];
  const student = students.find((s) => s.id === activeProject.studentId);

  return (
    <main className="container mx-auto max-w-7xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Thesis GPS</h1>
      <p className="text-muted-foreground mb-6">
        {student?.firstName} {student?.lastName} &mdash; {activeProject.title}
      </p>
      <ThesisGpsView projectId={activeProject.id} />
    </main>
  );
}
