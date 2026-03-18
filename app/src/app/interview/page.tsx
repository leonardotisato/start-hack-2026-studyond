import { getTopics, getCompanies } from "@/lib/data";

export default async function InterviewPage() {
  const [topics, companies] = await Promise.all([getTopics(), getCompanies()]);
  const jobTopics = topics.filter((t) => t.type === "job");

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Interview Prep</h1>
      <p className="text-muted-foreground mb-6">
        Select a role to generate your preparation guide.
      </p>
      {/* TODO: role selector → AI-generated prep guide with questions & topics */}
      <div className="grid gap-4">
        {jobTopics.slice(0, 6).map((topic) => {
          const company = companies.find((c) => c.id === topic.companyId);
          return (
            <div key={topic.id} className="rounded-lg border p-4 cursor-pointer hover:bg-accent transition">
              <p className="font-semibold">{topic.title}</p>
              <p className="text-sm text-muted-foreground">
                {company?.name} &middot; {topic.employmentType?.replace("_", " ")} &middot; {topic.workplaceType}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
