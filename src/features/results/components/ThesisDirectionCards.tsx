import type { RecommendationCard } from "@/lib/contracts/diagnosis";

type ThesisDirectionCardsProps = {
  items: RecommendationCard[];
};

export function ThesisDirectionCards({ items }: ThesisDirectionCardsProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ds-label">Suggested thesis directions</h3>
        <p className="text-xs text-muted-foreground">
          These are thesis path hypotheses, not final decisions.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-border bg-secondary p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="font-medium">{item.title}</h4>
              <span className="rounded-full border border-border px-3 py-1 text-xs capitalize">
                {item.kind}
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {item.rationale}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium">{item.ctaLabel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
