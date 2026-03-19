import { ConfidencePanel } from "@/features/results/components/ConfidencePanel";
import { GapAnalysisCard } from "@/features/results/components/GapAnalysisCard";
import { NextActionsList } from "@/features/results/components/NextActionsList";
import { StageMap } from "@/features/results/components/StageMap";
import { ThesisDirectionCards } from "@/features/results/components/ThesisDirectionCards";
import { createResultsViewModel } from "@/features/results/results-view-model";
import type { DiagnosisResult } from "@/lib/contracts/diagnosis";

type ThesisGpsResultsProps = {
  result: DiagnosisResult;
};

export function ThesisGpsResults({ result }: ThesisGpsResultsProps) {
  const viewModel = createResultsViewModel(result);

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border bg-card p-6">
        <p className="ds-label text-ai-solid">Thesis GPS result</p>
        <h1 className="header-lg">{viewModel.headline}</h1>
        <p className="ds-body max-w-3xl text-muted-foreground">
          {viewModel.summary}
        </p>
        <div className="grid gap-3 pt-2 md:grid-cols-4">
          {viewModel.quickStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-lg bg-secondary px-4 py-3"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-medium capitalize">{stat.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-border bg-card p-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="ds-label mb-2">Current focus</p>
          <h2 className="header-sm mb-3">{viewModel.currentFocusTitle}</h2>
          <p className="text-sm text-muted-foreground">{viewModel.currentFocusWhy}</p>
        </div>
        <div className="rounded-lg bg-secondary p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            What this diagnosis is saying
          </p>
          <p className="text-sm text-muted-foreground">
            You are not trying to solve the whole thesis today. You are trying
            to make the next move legible enough to act on.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <ConfidencePanel
          readinessScore={result.readinessScore}
          note={result.confidenceNote}
          clarityLabel={viewModel.clarityLabel}
          readinessLabel={viewModel.readinessLabel}
          chatSummary={result.chatSummary}
        />
        <GapAnalysisCard strengths={result.strengths} gaps={result.gaps} />
      </div>

      <StageMap nodes={result.roadmap} />
      <ThesisDirectionCards items={result.directions} />
      <NextActionsList items={result.nextActions} />
    </div>
  );
}
