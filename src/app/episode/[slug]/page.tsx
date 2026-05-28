import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { QuoteCard } from "@/components/quote-card";
import { SectionCard } from "@/components/section-card";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { getEpisodeBySlug } from "@/lib/queries";
import { formatTimestamp, parseTimestamp } from "@/lib/timestamps";

export const dynamic = "force-dynamic";

type EpisodeDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EpisodeDetailPage({ params, searchParams }: EpisodeDetailPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const episode = await getEpisodeBySlug(slug);
  const query = typeof search.q === "string" ? search.q : undefined;
  const startAt = parseTimestamp(typeof search.t === "string" ? search.t : undefined);

  if (!episode) notFound();

  return (
    <div className="space-y-8">
      <SectionCard>
        <div className="flex flex-wrap gap-2">
          <Badge>{episode.sourceType}</Badge>
          {episode.episodeTags.map((entry) => (
            <Badge key={entry.tag.id}>{entry.tag.name}</Badge>
          ))}
        </div>
        <h1 className="mt-4 text-4xl font-black uppercase leading-tight">{episode.title}</h1>
        <p className="mt-4 max-w-4xl leading-7 text-[var(--muted)]">{episode.description}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span>Guests: {episode.episodeGuests.map((entry) => entry.guest.name).join(", ")}</span>
          <span>Runtime: {formatTimestamp(episode.durationSeconds)}</span>
          <Link href={episode.sourceUrl} className="text-[var(--accent)] underline-offset-4 hover:underline">
            Public source
          </Link>
          {episode.audioUrl ? (
            <Link href={`${episode.audioUrl}#t=${startAt}`} className="text-[var(--accent)] underline-offset-4 hover:underline">
              Direct audio
            </Link>
          ) : null}
        </div>
        <p className="mt-5 text-sm text-[var(--danger)]">
          Warning: transcripts may contain redactions and imperfect auto-transcription. Do not use this archive to identify or target call recipients.
        </p>
      </SectionCard>

      <SectionCard title="Transcript">
        <TranscriptViewer
          episode={{ slug: episode.slug, title: episode.title, audioUrl: episode.audioUrl }}
          segments={episode.transcript ?? []}
          query={query}
          startAt={startAt}
        />
      </SectionCard>

      <SectionCard title="Notable Quotes">
        <div className="grid gap-4">
          {(episode.quotes ?? []).map((quote) => (
            <QuoteCard key={quote.id} quote={{ ...quote, episode }} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
