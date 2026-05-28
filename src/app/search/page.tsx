import Link from "next/link";
import { EpisodeCard } from "@/components/episode-card";
import { HighlightedText } from "@/components/highlighted-text";
import { SearchBar } from "@/components/search-bar";
import { SectionCard } from "@/components/section-card";
import { searchArchive } from "@/lib/queries";
import { shouldUsePhraseSearch } from "@/lib/search-snippets";
import { formatTimestamp } from "@/lib/timestamps";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const phraseSearch = shouldUsePhraseSearch(q, params.exact === "true");
  const results = await searchArchive({
    q,
    episode: typeof params.episode === "string" ? params.episode : undefined,
    source: typeof params.source === "string" ? params.source : "ALL",
    tag: typeof params.tag === "string" ? params.tag : undefined,
    speaker: typeof params.speaker === "string" ? params.speaker : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
    exact: params.exact === "true",
  });

  return (
    <div className="space-y-8">
      <SectionCard title="Search">
        <SearchBar defaultValue={q} />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <QuickFilter href={`/search?q=${encodeURIComponent(q)}&exact=true`} label="Exact phrase" />
          <QuickFilter href={`/search?q=${encodeURIComponent(q)}&source=YOUTUBE`} label="YouTube only" />
          <QuickFilter href={`/search?q=${encodeURIComponent(q)}&source=PODCAST`} label="Podcast only" />
          <QuickFilter href={`/search?q=${encodeURIComponent(q)}&tag=corn-down`} label="#corn down" />
          <QuickFilter href={`/search?q=${encodeURIComponent(q)}&speaker=dragonmere`} label="speaker: dragonmere" />
          <QuickFilter href={`/search?q=${encodeURIComponent(q)}&speaker=wastedmemory`} label="speaker: wastedmemory" />
        </div>
      </SectionCard>

      <SectionCard title={`Transcript Results (${results.segments.length})`}>
        <div className="grid gap-4">
          {results.segments.map((segment) => (
            <article key={segment.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>{segment.episode.title}</span>
                <span>{segment.speaker ?? "unknown"}</span>
                <span>{segment.episode.sourceType}</span>
              </div>
              <p className="mt-3 leading-7 text-[var(--text)]">
                <HighlightedText text={segment.snippetText} query={q} exact={phraseSearch} />
              </p>
              <Link
                href={`/episode/${segment.episode.slug}?t=${formatTimestamp(segment.startSeconds)}&q=${encodeURIComponent(q)}`}
                className="mt-4 inline-flex text-sm text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Jump to {formatTimestamp(segment.startSeconds)}
              </Link>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Episode Hits (${results.episodes.length})`}>
        <div className="grid gap-4">
          {results.episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Quote Hits (${results.quotes.length})`}>
        <div className="grid gap-4">
          {results.quotes.map((quote) => (
            <article key={quote.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <p className="text-lg text-[var(--text)]">
                &ldquo;<HighlightedText text={quote.text} query={q} exact={phraseSearch} />&rdquo;
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{quote.context}</p>
              <Link
                href={`/episode/${quote.episode.slug}?t=${formatTimestamp(quote.startSeconds)}&q=${encodeURIComponent(q)}`}
                className="mt-4 inline-flex text-sm text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Open in episode
              </Link>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function QuickFilter({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
    >
      {label}
    </Link>
  );
}
