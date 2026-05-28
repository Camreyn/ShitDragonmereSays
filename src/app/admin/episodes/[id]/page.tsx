import { notFound } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { runTranscriptRedaction, updateTranscriptSegment } from "@/lib/actions/admin";
import { getAdminEpisode } from "@/lib/queries";
import { formatTimestamp } from "@/lib/timestamps";

export const dynamic = "force-dynamic";

type AdminEpisodeDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEpisodeDetailPage({ params }: AdminEpisodeDetailProps) {
  const { id } = await params;
  const episode = await getAdminEpisode(id);
  if (!episode) notFound();

  return (
    <div className="space-y-8">
      <SectionCard title="Metadata">
        <h1 className="text-3xl font-black uppercase">{episode.title}</h1>
        <p className="mt-4 max-w-4xl leading-7 text-[var(--muted)]">{episode.description}</p>
        <form action={runTranscriptRedaction} className="mt-6">
          <input type="hidden" name="episodeId" value={episode.id} />
          <button className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)]">
            Re-run redaction pass
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Transcript Corrections">
        <div className="grid gap-4">
          {(episode.transcript ?? []).map((segment) => (
            <form key={segment.id} action={updateTranscriptSegment} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <input type="hidden" name="segmentId" value={segment.id} />
              <div className="mb-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>{formatTimestamp(segment.startSeconds)}</span>
                <span>{formatTimestamp(segment.endSeconds)}</span>
              </div>
              <input
                name="speaker"
                defaultValue={segment.speaker ?? ""}
                placeholder="speaker"
                className="mb-3 h-11 w-full rounded-xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.03)] px-4"
              />
              <textarea
                name="text"
                defaultValue={segment.text}
                rows={4}
                className="w-full rounded-xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.03)] p-4"
              />
              <p className="mt-3 text-sm text-[var(--muted)]">Published redacted preview: {segment.redactedText}</p>
              <button className="mt-4 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]">
                Save correction
              </button>
            </form>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
