import {
  getExperts,
  getCompanies,
  getSupervisors,
  getFields,
  getStudent,
  getUniversities,
} from "@/lib/data";
import { NetworkView } from "@/components/network/network-view";

export default async function NetworkPage() {
  const [experts, companies, supervisors, universities, fields, student] =
    await Promise.all([
      getExperts(),
      getCompanies(),
      getSupervisors(),
      getUniversities(),
      getFields(),
      getStudent("student-01"),
    ]);

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="font-display text-4xl font-semibold mb-2">
        Network & Referrals
      </h1>
      <p className="text-muted-foreground mb-6">
        Connect with {experts.length} industry experts and {supervisors.length}{" "}
        academic supervisors matched to your profile.
      </p>
      <NetworkView
        experts={experts}
        supervisors={supervisors}
        companies={companies}
        universities={universities}
        fields={fields}
        student={student!}
      />
    </main>
  );
}
