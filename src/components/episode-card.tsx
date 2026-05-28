import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "./badge";
import { formatTimestamp } from "@/lib/timestamps";
import type { EpisodeWithRelations } from "@/types";

export function EpisodeCard({ episode }: { episode: EpisodeWithRelations }) {
  return (
    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge>{episode.sourceType}</Badge>
        {episode.episodeTags.slice(0, 3).map((entry) => (
          <Badge key={entry.tag.id}>{entry.tag.name}</Badge>
        ))}
      </div>
      <Link href={`/episode/${episode.slug}`} className="group block">
        <h3 className="text-xl font-semibold text-[var(--text)] transition group-hover:text-[var(--accent)]">{episode.title}</h3>
      </Link>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{episode.description}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <span>{format(episode.publishedAt, "MMM d, yyyy")}</span>
        <span>{formatTimestamp(episode.durationSeconds)}</span>
        <span>{episode.episodeGuests.map((entry) => entry.guest.name).join(", ")}</span>
      </div>
    </article>
  );
}
