const prompts = [
  "I feel lost about what a good thesis looks like.",
  "I want a company-connected thesis but do not know where to start.",
  "How do I know if my skills are enough for this topic?",
  "I'm not sure how to narrow down my research question.",
  "How do I find and approach a supervisor?",
];

type PromptSuggestionsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export function PromptSuggestions({ onSelect, disabled }: PromptSuggestionsProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h3 className="ds-label mb-3">Not sure what to say? Try one of these:</h3>
      <ul className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
