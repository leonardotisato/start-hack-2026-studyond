const FEATURES = [
  {
    href: "/profile",
    title: "Student Profile & Portfolio",
    description: "Dynamic profile with project widgets sorted by relevance.",
  },
  {
    href: "/network",
    title: "Referral & Networking",
    description: "Connect with alumni, mentors, and industry professionals.",
  },
  {
    href: "/interview",
    title: "Interview Prep Coach",
    description: "AI-generated preparation guides, questions, and strategies.",
  },
  {
    href: "/planner",
    title: "Thesis GPS",
    description:
      "Navigate your thesis with a dynamic pipeline graph, task board, calendar, and milestone tracking.",
  },
];

export default function Home() {
  return (
    <main className="container mx-auto max-w-4xl py-16 px-4">
      <h1 className="text-4xl font-bold mb-2">Studyond</h1>
      <p className="text-lg text-muted-foreground mb-10">
        AI-powered platform for students — from thesis to career.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <a
            key={feature.href}
            href={feature.href}
            className="rounded-lg border p-6 hover:bg-accent transition"
          >
            <h2 className="text-lg font-semibold mb-1">{feature.title}</h2>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
