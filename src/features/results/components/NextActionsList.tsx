import type { RecommendationCard } from "@/lib/contracts/diagnosis";

type NextActionsListProps = {
  items: RecommendationCard[];
};

export function NextActionsList({ items }: NextActionsListProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ds-label">Next best actions</h3>
        <p className="text-xs text-muted-foreground">
          A good diagnosis is only useful if it immediately changes what you do next.
        </p>
      </div>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-lg border border-border bg-secondary p-4 text-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-medium">
                {index + 1}. {item.title}
              </p>
              <span className="rounded-full border border-border px-3 py-1 text-xs capitalize">
                {item.kind}
              </span>
            </div>
            <p className="mb-3 text-muted-foreground">{item.rationale}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.ctaLabel}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
