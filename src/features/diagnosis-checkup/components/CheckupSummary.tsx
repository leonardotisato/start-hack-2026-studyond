import { Link } from "react-router-dom";

import type { DiagnosisInput } from "@/lib/contracts/diagnosis";

type CheckupSummaryProps = {
  draft: DiagnosisInput;
  lastSubmittedAt: string | null;
};

function formatList(items: string[]) {
  return items.length > 0 ? items.join(", ") : "Not clarified yet";
}

function formatStage(stage: DiagnosisInput["currentStage"]) {
  return stage.replaceAll("_", " ");
}

export function CheckupSummary({
  draft,
  lastSubmittedAt,
}: CheckupSummaryProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ds-label">Starter package preview</h3>
        {lastSubmittedAt ? (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            Saved locally
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-lg bg-secondary p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Where am I?
          </p>
          <p className="font-medium capitalize">{formatStage(draft.currentStage)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Topic status: {draft.topicStatus.replaceAll("_", " ")}
          </p>
        </article>
        <article className="rounded-lg bg-secondary p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            What fits me?
          </p>
          <p className="font-medium">{formatList(draft.interests)}</p>
        </article>
        <article className="rounded-lg bg-secondary p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            What am I missing?
          </p>
          <p className="font-medium">{formatList(draft.skillGaps)}</p>
        </article>
        <article className="rounded-lg bg-secondary p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            What should I do next?
          </p>
          <p className="font-medium">{formatList(draft.blockers)}</p>
        </article>
      </div>
      {lastSubmittedAt ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="#mentor-chat"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Continue to mentor chat
          </a>
          <Link
            to="/results"
            className="rounded-full border border-border px-4 py-2 text-sm"
          >
            Preview Thesis GPS result
          </Link>
        </div>
      ) : null}
    </section>
  );
}
