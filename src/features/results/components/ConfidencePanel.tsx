type ConfidencePanelProps = {
  readinessScore: number;
  note: string;
  clarityLabel: string;
  readinessLabel: string;
  chatSummary: string;
};

export function ConfidencePanel({
  readinessScore,
  note,
  clarityLabel,
  readinessLabel,
  chatSummary,
}: ConfidencePanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h3 className="ds-label mb-2">Confidence and readiness</h3>
      <p className="mb-1 text-3xl font-semibold">{readinessScore}/100</p>
      <p className="mb-4 text-sm text-muted-foreground">{readinessLabel}</p>
      <div className="mb-4 rounded-lg bg-secondary p-4">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
          Clarity
        </p>
        <p className="font-medium">{clarityLabel}</p>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{note}</p>
      <div className="rounded-lg bg-secondary p-4">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
          Chat summary
        </p>
        <p className="text-sm text-muted-foreground">{chatSummary}</p>
      </div>
    </section>
  );
}
