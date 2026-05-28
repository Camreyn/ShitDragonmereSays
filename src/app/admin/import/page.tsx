import { SectionCard } from "@/components/section-card";
import { createImportJob } from "@/lib/actions/admin";
import { demoImportJobs } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const jobs = process.env.DATABASE_URL
    ? await prisma.adminImportJob.findMany({ orderBy: { createdAt: "desc" }, take: 12 })
    : demoImportJobs;

  return (
    <div className="space-y-8">
      <SectionCard title="Import Sources">
        <form action={createImportJob} className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
          <select name="sourceType" className="h-12 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-4">
            <option value="RSS">RSS feed</option>
            <option value="PODCAST">Podcast feed</option>
            <option value="PRANKCAST">Prankcast feed</option>
            <option value="YOUTUBE">YouTube playlist</option>
          </select>
          <input
            name="sourceUrl"
            type="url"
            required
            placeholder="https://example.com/feed.xml"
            className="h-12 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-4"
          />
          <button className="h-12 rounded-2xl bg-[var(--accent)] px-5 font-semibold text-[var(--accent-ink)]">Run import</button>
        </form>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          Only import public, legally usable material. Patreon-only, private, or user-targeting content should not be ingested.
        </p>
      </SectionCard>

      <SectionCard title="Recent Jobs">
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                <span>{job.sourceType}</span>
                <span>{job.status}</span>
                <span>{job.sourceUrl}</span>
              </div>
              {job.errorMessage ? <p className="mt-3 text-sm text-[var(--danger)]">{job.errorMessage}</p> : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
