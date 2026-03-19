import { AppShell } from "@/components/layout/AppShell";
import { useDiagnosisCheckupStore } from "@/features/diagnosis-checkup/useDiagnosisCheckupStore";
import { ThesisGpsResults } from "@/features/results/ThesisGpsResults";
import { createDiagnosisPreviewResult } from "@/features/results/results-view-model";
import { diagnosisResultFixture } from "@/lib/fixtures/diagnosis-result";

export function ResultsPage() {
  const draft = useDiagnosisCheckupStore((state) => state.draft);
  const personalizedResult = createDiagnosisPreviewResult(
    draft,
    diagnosisResultFixture,
  );

  return (
    <AppShell>
      <ThesisGpsResults result={personalizedResult} />
    </AppShell>
  );
}
