import Parser from "rss-parser";
import { ImportStatus, SourceType } from "@prisma/client";
import { YoutubeTranscript } from "youtube-transcript";
import { prisma } from "./prisma";
import { slugify } from "./slug";
import { parseSrt, parseTranscriptJson, parseVtt } from "./transcript";
import { redactSensitiveText } from "./redaction";

const parser = new Parser();
const blockedYoutubeTitles = new Set(["Private video", "Deleted video"]);

function extractYoutubeVideoId(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.replace("/", "").trim();
  }

  return url.searchParams.get("v");
}

async function replaceTranscriptSegments(
  episodeId: string,
  segments: Array<{
    startSeconds: number;
    endSeconds: number;
    speaker?: string | null;
    text: string;
  }>,
) {
  await prisma.transcriptSegment.deleteMany({ where: { episodeId } });
  await prisma.transcriptSegment.createMany({
    data: segments.map((segment) => {
      const redactedText = redactSensitiveText(segment.text);
      return {
        episodeId,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        speaker: segment.speaker,
        text: segment.text,
        redactedText,
        searchText: `${segment.speaker ?? ""} ${redactedText}`.trim(),
      };
    }),
  });
}

async function upsertTranscriptAudit(episodeId: string, status: ImportStatus, transcriptSegmentCount: number, message?: string) {
  await prisma.transcriptImportAudit.upsert({
    where: { episodeId },
    update: {
      status,
      transcriptSegmentCount,
      message,
      lastAttemptedAt: new Date(),
    },
    create: {
      episodeId,
      status,
      transcriptSegmentCount,
      message,
      lastAttemptedAt: new Date(),
    },
  });
}

export async function importPodcastFeed(sourceUrl: string) {
  const feed = await parser.parseURL(sourceUrl);

  for (const item of feed.items) {
    if (!item.title || !item.link || !item.pubDate) continue;
    await prisma.episode.upsert({
      where: { slug: slugify(item.title) },
      update: {
        description: item.contentSnippet ?? item.content ?? "",
        publishedAt: new Date(item.pubDate),
        sourceUrl: item.link,
        audioUrl: item.enclosure?.url,
      },
      create: {
        slug: slugify(item.title),
        title: item.title,
        description: item.contentSnippet ?? item.content ?? "",
        publishedAt: new Date(item.pubDate),
        durationSeconds: 0,
        sourceType: SourceType.RSS,
        sourceUrl: item.link,
        audioUrl: item.enclosure?.url,
        artworkUrl: feed.image?.url,
      },
    });
  }
}

export async function importYoutubeMetadata(sourceUrl: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = new URL(sourceUrl).searchParams.get("list");
  if (!playlistId) throw new Error("Playlist URL must include a list parameter");

  if (!apiKey) {
    const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);

    for (const item of feed.items) {
      if (!item.title || !item.link || !item.pubDate) continue;
      if (blockedYoutubeTitles.has(item.title)) continue;
      await prisma.episode.upsert({
        where: { slug: slugify(item.title) },
        update: {
          description: item.contentSnippet ?? item.content ?? "",
          publishedAt: new Date(item.pubDate),
          sourceUrl: item.link,
        },
        create: {
          slug: slugify(item.title),
          title: item.title,
          description: item.contentSnippet ?? item.content ?? "",
          publishedAt: new Date(item.pubDate),
          durationSeconds: 0,
          sourceType: SourceType.YOUTUBE,
          sourceUrl: item.link,
        },
      });
    }

    return;
  }

  let nextPageToken: string | undefined;

  do {
    const pageUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    pageUrl.searchParams.set("part", "snippet,contentDetails");
    pageUrl.searchParams.set("maxResults", "50");
    pageUrl.searchParams.set("playlistId", playlistId);
    pageUrl.searchParams.set("key", apiKey);
    if (nextPageToken) {
      pageUrl.searchParams.set("pageToken", nextPageToken);
    }

    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`YouTube import failed with status ${response.status}`);

    const json = (await response.json()) as {
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          publishedAt?: string;
          resourceId?: { videoId?: string };
          thumbnails?: { high?: { url?: string } };
        };
      }>;
    };

    for (const item of json.items ?? []) {
      const title = item.snippet?.title;
      const videoId = item.snippet?.resourceId?.videoId;
      if (!title || !videoId) continue;
      if (blockedYoutubeTitles.has(title)) continue;
      await prisma.episode.upsert({
        where: { slug: slugify(title) },
        update: {
          description: item.snippet?.description ?? "",
          sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
          artworkUrl: item.snippet?.thumbnails?.high?.url,
        },
        create: {
          slug: slugify(title),
          title,
          description: item.snippet?.description ?? "",
          publishedAt: new Date(item.snippet?.publishedAt ?? Date.now()),
          durationSeconds: 0,
          sourceType: SourceType.YOUTUBE,
          sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
          artworkUrl: item.snippet?.thumbnails?.high?.url,
        },
      });
    }

    nextPageToken = json.nextPageToken;
  } while (nextPageToken);
}

export async function importTranscriptFile(episodeId: string, fileName: string, contents: string) {
  const lower = fileName.toLowerCase();
  const parsed = lower.endsWith(".json") ? parseTranscriptJson(contents) : lower.endsWith(".vtt") ? parseVtt(contents) : parseSrt(contents);
  await replaceTranscriptSegments(
    episodeId,
    parsed.map((segment) => ({
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      speaker: segment.speaker,
      text: segment.text,
    })),
  );
}

export async function importYoutubeTranscriptForEpisode(episodeId: string, options?: { force?: boolean }) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { id: true, title: true, sourceType: true, sourceUrl: true, transcriptImportAudit: true, _count: { select: { transcript: true } } },
  });

  if (!episode) throw new Error(`Episode ${episodeId} not found`);
  if (episode.sourceType !== SourceType.YOUTUBE) {
    throw new Error(`Episode ${episode.title} is not a YouTube source`);
  }

  if (!options?.force && episode._count.transcript > 0) {
    await upsertTranscriptAudit(
      episode.id,
      ImportStatus.SKIPPED,
      episode._count.transcript,
      `Skipped because ${episode._count.transcript} transcript segments already exist.`,
    );

    return {
      episodeId: episode.id,
      title: episode.title,
      segmentCount: episode._count.transcript,
      skipped: true,
    };
  }

  const videoId = extractYoutubeVideoId(episode.sourceUrl);
  if (!videoId) throw new Error(`Could not parse a YouTube video id from ${episode.sourceUrl}`);

  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  if (!transcript.length) throw new Error(`No transcript returned for ${episode.title}`);

  const normalized = transcript.map((entry, index) => {
    const startSeconds = Math.max(0, Math.floor(entry.offset / 1000));
    const computedEnd = entry.duration ? Math.ceil((entry.offset + entry.duration) / 1000) : startSeconds + 4;
    const nextStart = transcript[index + 1] ? Math.floor(transcript[index + 1].offset / 1000) : undefined;
    const endSeconds = Math.max(startSeconds + 1, nextStart ? Math.max(startSeconds + 1, nextStart) : computedEnd);

    return {
      startSeconds,
      endSeconds,
      speaker: null,
      text: entry.text.replace(/\s+/g, " ").trim(),
    };
  });

  await replaceTranscriptSegments(episode.id, normalized);
  await upsertTranscriptAudit(episode.id, ImportStatus.SUCCEEDED, normalized.length, `Imported transcript from YouTube captions for ${videoId}.`);

  return {
    episodeId: episode.id,
    title: episode.title,
    videoId,
    segmentCount: normalized.length,
    skipped: false,
  };
}

export async function importYoutubeTranscriptsForSource(sourceUrl: string, options?: { force?: boolean }) {
  const playlistId = new URL(sourceUrl).searchParams.get("list");
  if (!playlistId) throw new Error("Playlist URL must include a list parameter");

  const episodes = await prisma.episode.findMany({
    where: {
      sourceType: SourceType.YOUTUBE,
      sourceUrl: {
        contains: "youtube.com/watch",
      },
    },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, sourceUrl: true },
  });

  const matchingEpisodes = episodes.filter((episode) => {
    const url = new URL(episode.sourceUrl);
    return url.searchParams.get("list") === playlistId;
  });

  const targetEpisodes = matchingEpisodes.length > 0 ? matchingEpisodes : episodes;

  const results: Array<{ episodeId: string; title: string; segmentCount?: number; error?: string; skipped?: boolean }> = [];

  for (const episode of targetEpisodes) {
    try {
      const result = await importYoutubeTranscriptForEpisode(episode.id, options);
      results.push(result);
    } catch (error) {
      await upsertTranscriptAudit(episode.id, ImportStatus.FAILED, 0, error instanceof Error ? error.message : "Unknown transcript import failure");
      results.push({
        episodeId: episode.id,
        title: episode.title,
        error: error instanceof Error ? error.message : "Unknown transcript import failure",
      });
    }
  }

  return results;
}
