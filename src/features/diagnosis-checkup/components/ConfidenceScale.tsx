type ConfidenceScaleProps = {
  value: number;
  onChange: (value: number) => void;
};

export function ConfidenceScale({ value, onChange }: ConfidenceScaleProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="ds-label">Confidence snapshot</h3>
        <label className="text-sm text-muted-foreground" htmlFor="confidence-level">
          Confidence level
        </label>
      </div>
      <input
        id="confidence-level"
        name="confidence-level"
        aria-label="Confidence level"
        type="number"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mb-3 w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => {
          const active = index < value;
          return (
            <span
              key={index}
              className={[
                "h-2 flex-1 rounded-full",
                active ? "bg-primary" : "bg-secondary",
              ].join(" ")}
            />
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>Lost</span>
        <span>Ready to act</span>
      </div>
    </section>
  );
}
