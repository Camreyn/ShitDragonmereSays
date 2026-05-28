import { EpisodeCard } from "@/components/episode-card";
import { QuoteCard } from "@/components/quote-card";
import { SearchBar } from "@/components/search-bar";
import { SectionCard } from "@/components/section-card";
import { getHomepageData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { episodes, quotes, tags } = await getHomepageData();

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-[var(--line)] bg-[color:rgba(16,19,22,0.85)] p-8">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Retro Prank-Call Archive</p>
        <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight md:text-6xl">
          Search quotes, transcripts, guests, and timestamps from public dragonmere / CORN DOWN episodes.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)]">
          This fan archive indexes public episodes only. Sensitive info is redacted before publishing, transcripts may be imperfect,
          and the site is for parody, search, and archival reference rather than targeting anybody in the calls.
        </p>
        <div className="mt-8">
          <SearchBar />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <SectionCard title="Recent Episodes">
          <div className="grid gap-4">
            {episodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Popular Quotes">
          <div className="grid gap-4">
            {quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Browse Tags">
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <a
              key={tag.id}
              href={`/search?tag=${tag.slug}`}
              className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--accent)]"
            >
              #{tag.name}
            </a>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
