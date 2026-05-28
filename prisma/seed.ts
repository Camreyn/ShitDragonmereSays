import { PrismaClient, SourceType } from "@prisma/client";
import { redactSensitiveText } from "../src/lib/redaction";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  await prisma.quoteTag.deleteMany();
  await prisma.episodeTag.deleteMany();
  await prisma.episodeGuest.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.transcriptSegment.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.adminImportJob.deleteMany();

  const tags = await Promise.all(
    ["corn down", "payphone", "ivr", "chaos", "callbacks"].map((name) =>
      prisma.tag.create({ data: { name, slug: slugify(name) } }),
    ),
  );

  const guests = await Promise.all(
    ["dragonmere", "wastedmemory", "guest goblin"].map((name) =>
      prisma.guest.create({ data: { name, slug: slugify(name) } }),
    ),
  );

  const seeds = [
    {
      title: "CORN DOWN 101: Placeholder Harvest",
      description:
        "Sample archival entry with placeholder metadata, redaction-safe transcript snippets, and audio deep links.",
      publishedAt: new Date("2024-09-14T19:00:00Z"),
      durationSeconds: 4125,
      sourceType: SourceType.PODCAST,
      sourceUrl: "https://example.com/public/placeholder-harvest",
      audioUrl: "https://example.com/public/audio/placeholder-harvest.mp3",
      artworkUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80",
      tags: ["corn down", "ivr", "chaos"],
      guests: ["dragonmere", "wastedmemory"],
      transcript: [
        ["dragonmere", 12, 32, "Welcome back to CORN DOWN, the archival-safe edition of total confusion."],
        ["wastedmemory", 33, 55, "If the menu says press seven for sales, we are absolutely pressing every other button first."],
        ["dragonmere", 510, 548, "Please note that any phone numbers in this archive are redacted before publication."],
        ["operator", 1980, 2012, "I cannot give out that information, and honestly I do not know why you keep asking about corn futures."],
      ] as const,
      quotes: [
        [33, 55, "If the menu says press seven for sales, we are absolutely pressing every other button first.", "Classic menu sabotage opener.", ["ivr", "chaos"]],
        [1980, 2012, "I cannot give out that information, and honestly I do not know why you keep asking about corn futures.", "Perfect deadpan resistance.", ["corn down"]],
      ] as const,
    },
    {
      title: "CORN DOWN 102: Silo Static",
      description:
        "Another seeded example with transcript highlights, guest metadata, and searchable quote snippets.",
      publishedAt: new Date("2024-10-03T19:00:00Z"),
      durationSeconds: 3894,
      sourceType: SourceType.YOUTUBE,
      sourceUrl: "https://youtube.com/watch?v=placeholder",
      audioUrl: "https://example.com/public/audio/silo-static.mp3",
      artworkUrl: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
      tags: ["payphone", "callbacks"],
      guests: ["dragonmere", "guest goblin"],
      transcript: [
        ["dragonmere", 64, 88, "This archive is for parody and search, not for targeting anybody from the calls."],
        ["guest goblin", 240, 271, "The best bit is when the fake hold music sounds like a haunted county fair."],
        ["dragonmere", 3020, 3060, "We redacted an address here because the transcription heard one that should never be published."],
      ] as const,
      quotes: [[64, 88, "This archive is for parody and search, not for targeting anybody from the calls.", "Front-page safety language candidate.", ["callbacks"]]] as const,
    },
  ];

  for (const seed of seeds) {
    const episode = await prisma.episode.create({
      data: {
        slug: slugify(seed.title),
        title: seed.title,
        description: seed.description,
        publishedAt: seed.publishedAt,
        durationSeconds: seed.durationSeconds,
        sourceType: seed.sourceType,
        sourceUrl: seed.sourceUrl,
        audioUrl: seed.audioUrl,
        artworkUrl: seed.artworkUrl,
      },
    });

    for (const tagName of seed.tags) {
      const tag = tags.find((entry) => entry.name === tagName);
      if (tag) await prisma.episodeTag.create({ data: { episodeId: episode.id, tagId: tag.id } });
    }

    for (const guestName of seed.guests) {
      const guest = guests.find((entry) => entry.name === guestName);
      if (guest) await prisma.episodeGuest.create({ data: { episodeId: episode.id, guestId: guest.id } });
    }

    const segmentIds = new Map<number, string>();

    for (const [speaker, startSeconds, endSeconds, text] of seed.transcript) {
      const redactedText = redactSensitiveText(text);
      const segment = await prisma.transcriptSegment.create({
        data: {
          episodeId: episode.id,
          startSeconds,
          endSeconds,
          speaker,
          text,
          redactedText,
          searchText: `${speaker} ${redactedText}`,
        },
      });

      segmentIds.set(startSeconds, segment.id);
    }

    for (const [startSeconds, endSeconds, text, context, quoteTags] of seed.quotes) {
      const quote = await prisma.quote.create({
        data: {
          episodeId: episode.id,
          transcriptSegmentId: segmentIds.get(startSeconds),
          startSeconds,
          endSeconds,
          text: redactSensitiveText(text),
          context,
        },
      });

      for (const tagName of quoteTags) {
        const tag = tags.find((entry) => entry.name === tagName);
        if (tag) await prisma.quoteTag.create({ data: { quoteId: quote.id, tagId: tag.id } });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
