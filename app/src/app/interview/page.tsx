import { getTopics, getCompanies, getFields, getStudent } from "@/lib/data";
import { InterviewView } from "@/components/interview/interview-view";

export default async function InterviewPage() {
  const [topics, companies, fields, student] = await Promise.all([
    getTopics(),
    getCompanies(),
    getFields(),
    getStudent("student-01"),
  ]);

  const jobTopics = topics.filter((t) => t.type === "job");
  const studentFields = fields.filter((f) => student!.fieldIds.includes(f.id));

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="font-display text-4xl font-semibold mb-2">
        Interview Prep
      </h1>
      <p className="text-muted-foreground mb-6">
        Select a role to generate your AI-powered preparation guide.
      </p>
      <InterviewView
        topics={jobTopics}
        companies={companies}
        fields={fields}
        student={student!}
        studentFields={studentFields}
      />
    </main>
  );
}
