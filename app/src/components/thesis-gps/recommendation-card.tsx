import type { Recommendation } from "@/types/gps";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  supervisor: { icon: "\u{1F393}", color: "border-blue-300 bg-blue-50" },
  expert: { icon: "\u{1F4BC}", color: "border-indigo-300 bg-indigo-50" },
  company: { icon: "\u{1F3E2}", color: "border-green-300 bg-green-50" },
  topic: { icon: "\u{1F4C4}", color: "border-violet-300 bg-violet-50" },
  university: { icon: "\u{1F3DB}\uFE0F", color: "border-amber-300 bg-amber-50" },
  program: { icon: "\u{1F4DA}", color: "border-teal-300 bg-teal-50" },
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const style = TYPE_ICONS[rec.type] ?? { icon: "\u{1F464}", color: "border-gray-300 bg-gray-50" };
  const matchPercent = Math.round(rec.matchScore * 100);

  return (
    <div className={`rounded-lg border ${style.color} p-3 text-xs`}>
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground truncate">{rec.name}</p>
            <span className="text-[10px] font-medium text-muted-foreground shrink-0">{matchPercent}% match</span>
          </div>
          <p className="text-muted-foreground truncate">{rec.title}</p>
          <p className="text-muted-foreground">{rec.affiliation}</p>
          {rec.fieldNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rec.fieldNames.map((f) => (
                <span key={f} className="rounded-full bg-violet-100 border border-violet-200 text-violet-800 px-1.5 py-0.5 text-[10px]">{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {rec.email && (
        <a
          href={`mailto:${rec.email}`}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Contact
        </a>
      )}
    </div>
  );
}
