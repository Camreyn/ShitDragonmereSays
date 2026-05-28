import type { EpisodeWithRelations } from "@/types";

type DemoQuote = {
  id: string;
  episodeId: string;
  transcriptSegmentId: string | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
  episode: { id: string; slug: string; title: string };
  quoteTags: { tag: { id: string; name: string; slug: string } }[];
};

export const demoEpisodes: EpisodeWithRelations[] = [
  {
    id: "ep-1",
    slug: "corn-down-101-placeholder-harvest",
    title: "CORN DOWN 101: Placeholder Harvest",
    description: "Sample archival entry with placeholder metadata, redaction-safe transcript snippets, and audio deep links.",
    publishedAt: new Date("2024-09-14T19:00:00Z"),
    durationSeconds: 4125,
    sourceType: "PODCAST",
    sourceUrl: "https://example.com/public/placeholder-harvest",
    audioUrl: "https://example.com/public/audio/placeholder-harvest.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80",
    createdAt: new Date(),
    updatedAt: new Date(),
    episodeTags: [
      { tag: { id: "tag-1", name: "corn down", slug: "corn-down" } },
      { tag: { id: "tag-2", name: "ivr", slug: "ivr" } },
      { tag: { id: "tag-3", name: "chaos", slug: "chaos" } },
    ],
    episodeGuests: [{ guest: { id: "guest-1", name: "dragonmere", slug: "dragonmere" } }, { guest: { id: "guest-2", name: "wastedmemory", slug: "wastedmemory" } }],
    transcript: [
      {
        id: "seg-1",
        episodeId: "ep-1",
        startSeconds: 12,
        endSeconds: 32,
        speaker: "dragonmere",
        text: "Welcome back to CORN DOWN, the archival-safe edition of total confusion.",
        redactedText: "Welcome back to CORN DOWN, the archival-safe edition of total confusion.",
        searchText: "dragonmere Welcome back to CORN DOWN, the archival-safe edition of total confusion.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "seg-2",
        episodeId: "ep-1",
        startSeconds: 33,
        endSeconds: 55,
        speaker: "wastedmemory",
        text: "If the menu says press seven for sales, we are absolutely pressing every other button first.",
        redactedText: "If the menu says press seven for sales, we are absolutely pressing every other button first.",
        searchText: "wastedmemory If the menu says press seven for sales, we are absolutely pressing every other button first.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "seg-3",
        episodeId: "ep-1",
        startSeconds: 510,
        endSeconds: 548,
        speaker: "dragonmere",
        text: "Please note that any phone numbers in this archive are redacted before publication.",
        redactedText: "Please note that any phone numbers in this archive are redacted before publication.",
        searchText: "dragonmere Please note that any phone numbers in this archive are redacted before publication.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    quotes: [
      {
        id: "quote-1",
        episodeId: "ep-1",
        transcriptSegmentId: "seg-2",
        startSeconds: 33,
        endSeconds: 55,
        text: "If the menu says press seven for sales, we are absolutely pressing every other button first.",
        context: "Classic menu sabotage opener.",
        createdAt: new Date(),
        updatedAt: new Date(),
        quoteTags: [{ tag: { id: "tag-2", name: "ivr", slug: "ivr" } }, { tag: { id: "tag-3", name: "chaos", slug: "chaos" } }],
      },
    ],
  },
  {
    id: "ep-2",
    slug: "corn-down-102-silo-static",
    title: "CORN DOWN 102: Silo Static",
    description: "Another seeded example with transcript highlights, guest metadata, and searchable quote snippets.",
    publishedAt: new Date("2024-10-03T19:00:00Z"),
    durationSeconds: 3894,
    sourceType: "YOUTUBE",
    sourceUrl: "https://youtube.com/watch?v=placeholder",
    audioUrl: "https://example.com/public/audio/silo-static.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
    createdAt: new Date(),
    updatedAt: new Date(),
    episodeTags: [{ tag: { id: "tag-4", name: "payphone", slug: "payphone" } }, { tag: { id: "tag-5", name: "callbacks", slug: "callbacks" } }],
    episodeGuests: [{ guest: { id: "guest-1", name: "dragonmere", slug: "dragonmere" } }, { guest: { id: "guest-3", name: "guest goblin", slug: "guest-goblin" } }],
    transcript: [
      {
        id: "seg-4",
        episodeId: "ep-2",
        startSeconds: 64,
        endSeconds: 88,
        speaker: "dragonmere",
        text: "This archive is for parody and search, not for targeting anybody from the calls.",
        redactedText: "This archive is for parody and search, not for targeting anybody from the calls.",
        searchText: "dragonmere This archive is for parody and search, not for targeting anybody from the calls.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    quotes: [
      {
        id: "quote-2",
        episodeId: "ep-2",
        transcriptSegmentId: "seg-4",
        startSeconds: 64,
        endSeconds: 88,
        text: "This archive is for parody and search, not for targeting anybody from the calls.",
        context: "Front-page safety language candidate.",
        createdAt: new Date(),
        updatedAt: new Date(),
        quoteTags: [{ tag: { id: "tag-5", name: "callbacks", slug: "callbacks" } }],
      },
    ],
  },
];

export const demoQuotes: DemoQuote[] = demoEpisodes.flatMap((episode) =>
  (episode.quotes ?? []).map((quote) => ({
    ...quote,
    episode: { id: episode.id, slug: episode.slug, title: episode.title },
  })),
);

export const demoTags = Array.from(
  new Map(demoEpisodes.flatMap((episode) => episode.episodeTags.map((entry) => [entry.tag.id, entry.tag]))).values(),
);

export const demoImportJobs = [
  {
    id: "job-1",
    sourceType: "RSS",
    sourceUrl: "https://example.com/feed.xml",
    status: "PENDING",
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
