import Link from "next/link";
import { formatTimestamp } from "@/lib/timestamps";

type QuoteCardProps = {
  quote: {
    id: string;
    text: string;
    startSeconds: number;
    context: string | null;
    episode: { slug: string; title: string };
    quoteTags: { tag: { id: string; name: string } }[];
  };
};

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] p-5">
      <p className="text-lg leading-7 text-[var(--text)]">&ldquo;{quote.text}&rdquo;</p>
      <p className="mt-3 text-sm text-[var(--muted)]">{quote.context}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <Link href={`/episode/${quote.episode.slug}?t=${formatTimestamp(quote.startSeconds)}`} className="hover:text-[var(--accent)]">
          {quote.episode.title} @ {formatTimestamp(quote.startSeconds)}
        </Link>
        <Link href={`/quotes/${quote.id}`} className="hover:text-[var(--accent)]">
          Permalink
        </Link>
      </div>
    </article>
  );
}
