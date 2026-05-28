import { Meilisearch } from "meilisearch";
import { prisma } from "./prisma";
import { formatTimestamp } from "./timestamps";

export async function indexSearchDocuments() {
  if (!process.env.MEILISEARCH_HOST) throw new Error("MEILISEARCH_HOST is not configured");

  const client = new Meilisearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_API_KEY,
  });

  const [episodes, quotes, segments] = await Promise.all([
    prisma.episode.findMany({ include: { episodeTags: { include: { tag: true } }, episodeGuests: { include: { guest: true } } } }),
    prisma.quote.findMany({ include: { episode: true, quoteTags: { include: { tag: true } } } }),
    prisma.transcriptSegment.findMany({ include: { episode: true } }),
  ]);

  await client.index("episodes").addDocuments(
    episodes.map((episode) => ({
      id: episode.id,
      slug: episode.slug,
      title: episode.title,
      description: episode.description,
      publishedAt: episode.publishedAt.toISOString(),
      sourceType: episode.sourceType,
      tags: episode.episodeTags.map((entry) => entry.tag.slug),
      guests: episode.episodeGuests.map((entry) => entry.guest.slug),
    })),
  );

  await client.index("quotes").addDocuments(
    quotes.map((quote) => ({
      id: quote.id,
      episodeSlug: quote.episode.slug,
      text: quote.text,
      context: quote.context,
      timestamp: formatTimestamp(quote.startSeconds),
      tags: quote.quoteTags.map((entry) => entry.tag.slug),
    })),
  );

  await client.index("transcript_segments").addDocuments(
    segments.map((segment) => ({
      id: segment.id,
      episodeSlug: segment.episode.slug,
      speaker: segment.speaker,
      text: segment.redactedText,
      startSeconds: segment.startSeconds,
      timestamp: formatTimestamp(segment.startSeconds),
    })),
  );
}
