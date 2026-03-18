type GapAnalysisCardProps = {
  strengths: string[];
  gaps: string[];
};

export function GapAnalysisCard({ strengths, gaps }: GapAnalysisCardProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ds-label">Readiness and gaps</h3>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
          {strengths.length} strengths · {gaps.length} risks
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Strengths</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {strengths.map((item) => (
              <li key={item}>+ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Gaps</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {gaps.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
