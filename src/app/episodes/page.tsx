import { EpisodeCard } from "@/components/episode-card";
import { SectionCard } from "@/components/section-card";
import { getEpisodes } from "@/lib/queries";

export const dynamic = "force-dynamic";

type EpisodesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EpisodesPage({ searchParams }: EpisodesPageProps) {
  const params = await searchParams;
  const episodes = await getEpisodes({
    q: typeof params.q === "string" ? params.q : undefined,
    tag: typeof params.tag === "string" ? params.tag : undefined,
    source: typeof params.source === "string" ? params.source : undefined,
  });

  return (
    <SectionCard title="Episodes">
      <div className="mb-6 text-sm text-[var(--muted)]">
        Public-feed episodes only. Metadata and transcripts should be checked for redactions before publishing.
      </div>
      <div className="grid gap-4">
        {episodes.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
      </div>
    </SectionCard>
  );
}
