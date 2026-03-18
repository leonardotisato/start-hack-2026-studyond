export default function PlannerPage() {
  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Shared Planning Space</h1>
      <p className="text-muted-foreground mb-6">
        Collaborative workspace for teams and thesis milestone tracking.
      </p>
      {/* TODO: shared calendar, task board, milestone tracker, realtime via Supabase */}
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Task board, shared calendar, and milestone tracker go here.
      </div>
    </main>
  );
}
