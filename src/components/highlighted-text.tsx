import { getHighlightRegex } from "@/lib/search-snippets";

type HighlightedTextProps = {
  text: string;
  query?: string;
  exact?: boolean;
  className?: string;
};

export function HighlightedText({ text, query, exact = false, className }: HighlightedTextProps) {
  const regex = query ? getHighlightRegex(query, exact) : null;

  if (!regex) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={`${part}-${index}`} className="rounded bg-[var(--accent)] px-1 font-semibold text-[var(--accent-ink)]">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}
