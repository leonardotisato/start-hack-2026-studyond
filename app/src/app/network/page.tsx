import { getExperts, getCompanies, getSupervisors, getFields } from "@/lib/data";

export default async function NetworkPage() {
  const [experts, companies, supervisors, fields] = await Promise.all([
    getExperts(),
    getCompanies(),
    getSupervisors(),
    getFields(),
  ]);

  const availableExperts = experts.filter((e) => e.offerInterviews);

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Network & Referrals</h1>
      <p className="text-muted-foreground mb-6">
        {availableExperts.length} experts available for introductions across{" "}
        {companies.length} companies and {supervisors.length} supervisors.
      </p>
      {/* TODO: matching engine UI, expert cards, referral request flow */}
      <div className="grid gap-4 md:grid-cols-2">
        {availableExperts.slice(0, 6).map((expert) => {
          const company = companies.find((c) => c.id === expert.companyId);
          const expertFields = fields.filter((f) => expert.fieldIds.includes(f.id));
          return (
            <div key={expert.id} className="rounded-lg border p-4">
              <p className="font-semibold">{expert.firstName} {expert.lastName}</p>
              <p className="text-sm text-muted-foreground">{expert.title} &middot; {company?.name}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {expertFields.map((f) => (
                  <span key={f.id} className="text-xs bg-secondary px-2 py-0.5 rounded">{f.name}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
