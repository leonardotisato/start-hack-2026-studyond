import {
  getStudents,
  getProjects,
  getFields,
  getStudyPrograms,
  getUniversities,
  getTopics,
  getCompanies,
} from "@/lib/data";
import { ProfileView } from "@/components/profile/profile-view";

interface ProfilePageProps {
  searchParams: Promise<{ viewer?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const viewerMode = params.viewer === "company";

  const [students, projects, fields, programs, universities, topics, companies] =
    await Promise.all([
      getStudents(),
      getProjects(),
      getFields(),
      getStudyPrograms(),
      getUniversities(),
      getTopics(),
      getCompanies(),
    ]);

  // Demo: show the first student with a project
  const student = students[0];
  const studentProjects = projects.filter((p) => p.studentId === student.id);
  const studentFields = fields.filter((f) => student.fieldIds.includes(f.id));
  const program = programs.find((p) => p.id === student.studyProgramId);
  const university = universities.find((u) => u.id === student.universityId);

  // Resolve topics and companies for student's projects
  const projectTopicIds = new Set(
    studentProjects.map((p) => p.topicId).filter(Boolean)
  );
  const projectCompanyIds = new Set(
    studentProjects.map((p) => p.companyId).filter(Boolean)
  );

  const relevantTopics = topics.filter((t) => projectTopicIds.has(t.id));
  const relevantCompanies = companies.filter((c) =>
    projectCompanyIds.has(c.id)
  );

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Student Profile</h1>
      <ProfileView
        student={student}
        projects={studentProjects}
        fields={studentFields}
        program={program ?? null}
        university={university ?? null}
        topics={relevantTopics}
        companies={relevantCompanies}
        viewerMode={viewerMode}
      />
    </main>
  );
}
