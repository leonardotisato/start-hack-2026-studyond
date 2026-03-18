import { getStudents, getProjects, getFields, getStudyPrograms, getUniversities } from "@/lib/data";
import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage() {
  const [students, projects, fields, programs, universities] = await Promise.all([
    getStudents(),
    getProjects(),
    getFields(),
    getStudyPrograms(),
    getUniversities(),
  ]);

  // Demo: show the first student with a project
  const student = students[0];
  const studentProjects = projects.filter((p) => p.studentId === student.id);
  const studentFields = fields.filter((f) => student.fieldIds.includes(f.id));
  const program = programs.find((p) => p.id === student.studyProgramId);
  const university = universities.find((u) => u.id === student.universityId);

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Student Profile</h1>
      <ProfileView
        student={student}
        projects={studentProjects}
        fields={studentFields}
        program={program ?? null}
        university={university ?? null}
      />
    </main>
  );
}
