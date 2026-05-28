import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { getQuoteById } from "@/lib/queries";
import { formatTimestamp } from "@/lib/timestamps";

export const dynamic = "force-dynamic";

type QuoteDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function QuoteDetailPage({ params }: QuoteDetailProps) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();

  return (
    <SectionCard title="Quote Permalink">
      <p className="text-3xl font-semibold leading-tight">&ldquo;{quote.text}&rdquo;</p>
      <p className="mt-4 leading-7 text-[var(--muted)]">{quote.context}</p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <span>{quote.episode.title}</span>
        <span>
          {formatTimestamp(quote.startSeconds)} to {formatTimestamp(quote.endSeconds)}
        </span>
      </div>
      <Link
        href={`/episode/${quote.episode.slug}?t=${formatTimestamp(quote.startSeconds)}`}
        className="mt-6 inline-flex rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-[var(--accent-ink)]"
      >
        Jump to episode timestamp
      </Link>
    </SectionCard>
  );
}
