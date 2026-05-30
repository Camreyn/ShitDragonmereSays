import type { SourceType } from "@prisma/client";

export type PlaybackTrack =
  | {
      kind: "audio";
      title: string;
      slug: string;
      audioUrl: string;
    }
  | {
      kind: "youtube";
      title: string;
      slug: string;
      videoId: string;
    };

export function extractYouTubeVideoId(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").trim() || null;
    }

    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

export function buildPlaybackTrack(episode: {
  title: string;
  slug: string;
  sourceType: SourceType | "RSS" | "YOUTUBE" | "PODCAST" | "PRANKCAST" | "LOCAL";
  sourceUrl: string;
  audioUrl: string | null;
}): PlaybackTrack | null {
  if (episode.audioUrl) {
    return {
      kind: "audio",
      title: episode.title,
      slug: episode.slug,
      audioUrl: episode.audioUrl,
    };
  }

  if (episode.sourceType === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(episode.sourceUrl);
    if (!videoId) return null;

    return {
      kind: "youtube",
      title: episode.title,
      slug: episode.slug,
      videoId,
    };
  }

  return null;
}
