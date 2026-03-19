import type { RoadmapNode } from "@/lib/contracts/diagnosis";

type StageMapProps = {
  nodes: RoadmapNode[];
};

export function StageMap({ nodes }: StageMapProps) {
  const statusStyles: Record<RoadmapNode["status"], string> = {
    done: "border-transparent bg-secondary text-foreground",
    current: "border-primary bg-primary text-primary-foreground",
    next: "border-border bg-secondary text-foreground",
    blocked: "border-destructive bg-background text-foreground",
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ds-label">Directed stage map</h3>
        <p className="text-xs text-muted-foreground">
          The map shows what is done, what is current, and what is blocked.
        </p>
      </div>
      <div className="space-y-4">
        {nodes.map((node) => (
          <article
            key={node.id}
            className="rounded-lg border border-border bg-secondary p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="font-medium">{node.title}</h4>
              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs capitalize",
                  statusStyles[node.status],
                ].join(" ")}
              >
                {node.status}
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{node.description}</p>
            <p className="mb-3 text-sm">
              <span className="font-medium">Why it matters:</span>{" "}
              <span className="text-muted-foreground">{node.whyItMatters}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {node.suggestedWeek ? (
                <span className="rounded-full border border-border px-3 py-1">
                  Suggested week {node.suggestedWeek}
                </span>
              ) : null}
              {node.blockedBy.map((blocker) => (
                <span
                  key={blocker}
                  className="rounded-full border border-border px-3 py-1"
                >
                  Blocked by: {blocker}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
