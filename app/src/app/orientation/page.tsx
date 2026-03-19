import { getTopics, getCompanies, getFields, getStudent } from "@/lib/data";
import { OrientationView } from "@/components/orientation/orientation-view";

export default async function OrientationPage() {
  const [topics, companies, fields, student] = await Promise.all([
    getTopics(),
    getCompanies(),
    getFields(),
    getStudent("student-01"),
  ]);

  const studentFields = fields.filter((f) => student!.fieldIds.includes(f.id));

  return (
    <main className="container mx-auto max-w-5xl py-10 px-4">
      <h1 className="font-display text-4xl font-semibold mb-2">
        Orientation
      </h1>
      <p className="text-muted-foreground mb-6">
        Discover fields, explore thesis and job topics, and find your direction.
      </p>
      <OrientationView
        topics={topics}
        companies={companies}
        fields={fields}
        student={student!}
        studentFields={studentFields}
      />
    </main>
  );
}
