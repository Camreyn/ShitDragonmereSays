import { Prisma, SourceType } from "@prisma/client";
import type { SearchFilters } from "@/types";
import { buildSentenceSnippet, shouldUsePhraseSearch } from "./search-snippets";
import { demoEpisodes, demoQuotes, demoTags } from "./demo-data";
import { prisma } from "./prisma";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export async function getHomepageData() {
  if (!hasDatabaseUrl) {
    return {
      episodes: demoEpisodes.slice(0, 6),
      quotes: demoQuotes.slice(0, 6),
      tags: demoTags,
    };
  }

  const [episodes, quotes, tags] = await Promise.all([
    prisma.episode.findMany({
      take: 6,
      orderBy: { publishedAt: "desc" },
      include: { episodeTags: { include: { tag: true } }, episodeGuests: { include: { guest: true } } },
    }),
    prisma.quote.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { episode: true, quoteTags: { include: { tag: true } } },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { episodes, quotes, tags };
}

export async function getEpisodes(filters?: { tag?: string; source?: string; q?: string }) {
  if (!hasDatabaseUrl) {
    return demoEpisodes.filter((episode) => {
      if (filters?.source && filters.source !== "ALL" && episode.sourceType !== filters.source) return false;
      if (filters?.tag && !episode.episodeTags.some((entry) => entry.tag.slug === filters.tag)) return false;
      if (filters?.q) {
        const needle = filters.q.toLowerCase();
        return episode.title.toLowerCase().includes(needle) || episode.description.toLowerCase().includes(needle);
      }
      return true;
    });
  }

  const where: Prisma.EpisodeWhereInput = {
    ...(filters?.source && filters.source !== "ALL" ? { sourceType: filters.source as SourceType } : {}),
    ...(filters?.tag ? { episodeTags: { some: { tag: { slug: filters.tag } } } } : {}),
    ...(filters?.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.episode.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: { episodeTags: { include: { tag: true } }, episodeGuests: { include: { guest: true } } },
  });
}

export async function getEpisodeBySlug(slug: string) {
  if (!hasDatabaseUrl) {
    return demoEpisodes.find((episode) => episode.slug === slug) ?? null;
  }

  return prisma.episode.findUnique({
    where: { slug },
    include: {
      episodeTags: { include: { tag: true } },
      episodeGuests: { include: { guest: true } },
      transcript: { orderBy: { startSeconds: "asc" } },
      quotes: { include: { quoteTags: { include: { tag: true } } }, orderBy: { startSeconds: "asc" } },
    },
  });
}

export async function getQuotes() {
  if (!hasDatabaseUrl) {
    return demoQuotes;
  }

  return prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { episode: true, quoteTags: { include: { tag: true } } },
  });
}

export async function getQuoteById(id: string) {
  if (!hasDatabaseUrl) {
    return demoQuotes.find((quote) => quote.id === id) ?? null;
  }

  return prisma.quote.findUnique({
    where: { id },
    include: { episode: true, transcriptSegment: true, quoteTags: { include: { tag: true } } },
  });
}

export async function searchArchive(filters: SearchFilters) {
  const query = filters.q?.trim();
  const phraseSearch = query ? shouldUsePhraseSearch(query, filters.exact) : false;
  if (!hasDatabaseUrl) {
    const lowered = query?.toLowerCase() ?? "";
    const episodes = demoEpisodes.filter((episode) => {
      if (filters.source && filters.source !== "ALL" && episode.sourceType !== filters.source) return false;
      if (filters.tag && !episode.episodeTags.some((entry) => entry.tag.slug === filters.tag)) return false;
      if (!lowered) return true;
      const haystack = `${episode.title} ${episode.description}`.toLowerCase();
      if (phraseSearch) return haystack.includes(lowered);
      return lowered.split(/\s+/).some((term) => haystack.includes(term));
    });

    const segments = demoEpisodes
      .flatMap((episode) => (episode.transcript ?? []).map((segment) => ({ ...segment, episode })))
      .filter((segment) => {
        if (filters.speaker && segment.speaker?.toLowerCase() !== filters.speaker.toLowerCase()) return false;
        if (filters.episode && segment.episode.slug !== filters.episode) return false;
        if (filters.tag && !segment.episode.episodeTags.some((entry) => entry.tag.slug === filters.tag)) return false;
        if (filters.source && filters.source !== "ALL" && segment.episode.sourceType !== filters.source) return false;
        if (!lowered) return true;
        if (phraseSearch) return segment.searchText.toLowerCase().includes(lowered);
        return lowered.split(/\s+/).some((term) => segment.searchText.toLowerCase().includes(term));
      })
      .map((segment) => ({
        ...segment,
        snippetText: buildSentenceSnippet(segment.redactedText, lowered, phraseSearch),
      }));

    const quotes = demoQuotes.filter((quote) =>
      !lowered
        ? true
        : phraseSearch
          ? quote.text.toLowerCase().includes(lowered)
          : lowered.split(/\s+/).some((term) => quote.text.toLowerCase().includes(term)),
    );
    return { episodes, segments, quotes };
  }

  const episodeWhere: Prisma.EpisodeWhereInput = {
    ...(filters.source && filters.source !== "ALL" ? { sourceType: filters.source as SourceType } : {}),
    ...(filters.tag ? { episodeTags: { some: { tag: { slug: filters.tag } } } } : {}),
    ...(filters.from || filters.to
      ? { publishedAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } }
      : {}),
    ...(query
      ? phraseSearch
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {
            OR: query.split(/\s+/).flatMap((term) => [
              { title: { contains: term, mode: "insensitive" } },
              { description: { contains: term, mode: "insensitive" } },
            ]),
          }
      : {}),
  };

  const episodes = await prisma.episode.findMany({
    where: episodeWhere,
    take: 25,
    orderBy: { publishedAt: "desc" },
    include: { episodeTags: { include: { tag: true } }, episodeGuests: { include: { guest: true } } },
  });

  const transcriptWhere: Prisma.TranscriptSegmentWhereInput = {
    ...(filters.speaker ? { speaker: { equals: filters.speaker, mode: "insensitive" } } : {}),
    ...(filters.episode ? { episode: { slug: filters.episode } } : {}),
    ...(filters.tag ? { episode: { episodeTags: { some: { tag: { slug: filters.tag } } } } } : {}),
    ...(filters.source && filters.source !== "ALL" ? { episode: { sourceType: filters.source as SourceType } } : {}),
    ...(filters.from || filters.to
      ? { episode: { publishedAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } } }
      : {}),
    ...(query
      ? phraseSearch
        ? { searchText: { contains: query, mode: "insensitive" } }
        : { OR: query.split(/\s+/).map((term) => ({ searchText: { contains: term, mode: "insensitive" } })) }
      : {}),
  };

  const rawSegments = await prisma.transcriptSegment.findMany({
    where: transcriptWhere,
    take: 60,
    orderBy: [{ episode: { publishedAt: "desc" } }, { startSeconds: "asc" }],
    include: { episode: true },
  });

  const segments = await Promise.all(
    rawSegments.map(async (segment) => {
      const neighbors = await prisma.transcriptSegment.findMany({
        where: {
          episodeId: segment.episodeId,
          startSeconds: {
            gte: Math.max(0, segment.startSeconds - 18),
            lte: segment.startSeconds + 24,
          },
        },
        orderBy: { startSeconds: "asc" },
        select: { redactedText: true },
      });

      const combined = neighbors.map((entry) => entry.redactedText).join(" ");

      return {
        ...segment,
        snippetText: buildSentenceSnippet(combined, query ?? "", phraseSearch),
      };
    }),
  );

  const quotes = query
    ? await prisma.quote.findMany({
        where: {
          ...(phraseSearch
            ? { text: { contains: query, mode: "insensitive" } }
            : {
                OR: query.split(/\s+/).map((term) => ({
                  text: { contains: term, mode: "insensitive" },
                })),
              }),
          ...(filters.tag ? { quoteTags: { some: { tag: { slug: filters.tag } } } } : {}),
        },
        include: { episode: true, quoteTags: { include: { tag: true } } },
      })
    : [];

  return { episodes, segments, quotes };
}

export async function getAdminEpisodes() {
  if (!hasDatabaseUrl) {
    return demoEpisodes.map((episode) => ({
      ...episode,
      transcript: (episode.transcript ?? []).slice(0, 12),
      _count: { transcript: episode.transcript?.length ?? 0 },
      transcriptImportAudit: (episode.transcript?.length ?? 0)
        ? {
            episodeId: episode.id,
            status: "SUCCEEDED",
            message: "Demo transcript loaded.",
            transcriptSegmentCount: episode.transcript?.length ?? 0,
            lastAttemptedAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    }));
  }

  return prisma.episode.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      episodeTags: { include: { tag: true } },
      transcript: { orderBy: { startSeconds: "asc" }, take: 12 },
      transcriptImportAudit: true,
      _count: { select: { transcript: true } },
    },
  });
}

export async function getAdminEpisode(id: string) {
  if (!hasDatabaseUrl) {
    return demoEpisodes.find((episode) => episode.id === id) ?? null;
  }

  return prisma.episode.findUnique({
    where: { id },
    include: {
      episodeTags: { include: { tag: true } },
      episodeGuests: { include: { guest: true } },
      transcript: { orderBy: { startSeconds: "asc" } },
      quotes: { include: { quoteTags: { include: { tag: true } } }, orderBy: { startSeconds: "asc" } },
      transcriptImportAudit: true,
    },
  });
}

export async function getAdminTranscriptReport() {
  if (!hasDatabaseUrl) {
    const totalEpisodes = demoEpisodes.length;
    const withTranscript = demoEpisodes.filter((episode) => (episode.transcript?.length ?? 0) > 0).length;
    return {
      counts: {
        totalEpisodes,
        withTranscript,
        missingTranscript: totalEpisodes - withTranscript,
        succeeded: withTranscript,
        skipped: 0,
        failed: 0,
      },
      failures: [],
      missing: demoEpisodes.filter((episode) => (episode.transcript?.length ?? 0) === 0),
    };
  }

  const [totalEpisodes, withTranscript, audits, missing] = await Promise.all([
    prisma.episode.count({ where: { sourceType: SourceType.YOUTUBE } }),
    prisma.episode.count({ where: { sourceType: SourceType.YOUTUBE, transcript: { some: {} } } }),
    prisma.transcriptImportAudit.findMany({
      include: { episode: { select: { id: true, slug: true, title: true } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.episode.findMany({
      where: {
        sourceType: SourceType.YOUTUBE,
        transcript: { none: {} },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        sourceUrl: true,
        transcriptImportAudit: true,
      },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

    return {
      counts: {
        totalEpisodes,
        withTranscript,
        missingTranscript: totalEpisodes - withTranscript,
        succeeded: withTranscript,
        skipped: audits.filter((audit) => audit.status === "SKIPPED").length,
        failed: audits.filter((audit) => audit.status === "FAILED").length,
      },
    failures: audits.filter((audit) => audit.status === "FAILED"),
    missing,
  };
}
