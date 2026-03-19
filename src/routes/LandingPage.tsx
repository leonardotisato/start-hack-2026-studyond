import { Link } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";

export function LandingPage() {
  return (
    <AppShell>
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6 rounded-lg border border-border bg-card p-8">
          <p className="ds-label text-ai-solid">Start-of-thesis support</p>
          <h1 className="header-xl max-w-3xl">
            Thesis GPS helps lost students understand where they are, what
            they are missing, and what to do next.
          </h1>
          <p className="ds-body max-w-2xl text-muted-foreground">
            This scaffold gives the team a shared foundation before parallel
            work starts: route shell, diagnosis contracts, placeholder
            features, and a thin API skeleton.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/diagnosis"
              className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground"
            >
              Open diagnosis flow
            </Link>
            <Link
              to="/results"
              className="rounded-full border border-border px-5 py-3 text-sm"
            >
              Open results skeleton
            </Link>
          </div>
        </div>
        <aside className="space-y-4 rounded-lg border border-border bg-card p-8">
          <h2 className="header-sm">Parallel workstreams</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li>1. App shell, routing, and contracts</li>
            <li>2. Structured diagnosis checkup</li>
            <li>3. Mentor chat and diagnosis API</li>
            <li>4. Results experience and stage map</li>
          </ol>
        </aside>
      </section>
    </AppShell>
  );
}
