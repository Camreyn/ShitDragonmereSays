import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { getAdminEpisodes, getAdminTranscriptReport } from "@/lib/queries";
import { formatTimestamp } from "@/lib/timestamps";

export const dynamic = "force-dynamic";

export default async function AdminEpisodesPage() {
  const [episodes, report] = await Promise.all([getAdminEpisodes(), getAdminTranscriptReport()]);

  return (
    <div className="space-y-8">
      <SectionCard title="Transcript Report">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Public Episodes" value={report.counts.totalEpisodes} />
          <MetricCard label="With Transcript" value={report.counts.withTranscript} />
          <MetricCard label="Missing" value={report.counts.missingTranscript} />
          <MetricCard label="Imported" value={report.counts.succeeded} />
          <MetricCard label="Skipped" value={report.counts.skipped} />
          <MetricCard label="Failed" value={report.counts.failed} />
        </div>
        {report.failures.length ? (
          <div className="mt-6 grid gap-3">
            {report.failures.map((failure) => (
              <div key={failure.episodeId} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                <p className="font-semibold text-[var(--text)]">{failure.episode.title}</p>
                <p className="mt-2 text-sm text-[var(--danger)]">{failure.message ?? "Transcript import failed."}</p>
              </div>
            ))}
          </div>
        ) : null}
        {report.missing.length ? (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
            <p className="text-sm text-[var(--muted)]">
              Missing transcripts currently: {report.missing.map((episode) => episode.title).slice(0, 6).join(", ")}
              {report.missing.length > 6 ? `, and ${report.missing.length - 6} more.` : ""}
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Episode Admin">
        <div className="grid gap-4">
          {episodes.map((episode) => (
            <article key={episode.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{episode.title}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {episode._count.transcript} transcript segments loaded, runtime {formatTimestamp(episode.durationSeconds)}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                    Transcript status: {episode.transcriptImportAudit?.status ?? "PENDING"}
                  </p>
                  {episode.transcriptImportAudit?.message ? <p className="mt-2 text-sm text-[var(--muted)]">{episode.transcriptImportAudit.message}</p> : null}
                </div>
                <Link
                  href={`/admin/episodes/${episode.id}`}
                  className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
                >
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--text)]">{value}</p>
    </div>
  );
}
