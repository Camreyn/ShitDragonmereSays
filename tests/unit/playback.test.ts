import { describe, expect, it } from "vitest";
import { buildPlaybackTrack, extractYouTubeVideoId } from "@/lib/playback";

describe("extractYouTubeVideoId", () => {
  it("reads standard youtube watch URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=abc123xyz")).toBe("abc123xyz");
  });

  it("reads youtu.be short URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/abc123xyz")).toBe("abc123xyz");
  });

  it("returns null for invalid URLs", () => {
    expect(extractYouTubeVideoId("not-a-url")).toBeNull();
  });
});

describe("buildPlaybackTrack", () => {
  it("prefers direct audio URLs when available", () => {
    expect(
      buildPlaybackTrack({
        title: "Episode",
        slug: "episode",
        sourceType: "YOUTUBE",
        sourceUrl: "https://www.youtube.com/watch?v=abc123xyz",
        audioUrl: "https://cdn.example.com/audio.mp3",
      }),
    ).toEqual({
      kind: "audio",
      title: "Episode",
      slug: "episode",
      audioUrl: "https://cdn.example.com/audio.mp3",
    });
  });

  it("builds a youtube playback track when no direct audio URL exists", () => {
    expect(
      buildPlaybackTrack({
        title: "Episode",
        slug: "episode",
        sourceType: "YOUTUBE",
        sourceUrl: "https://www.youtube.com/watch?v=abc123xyz",
        audioUrl: null,
      }),
    ).toEqual({
      kind: "youtube",
      title: "Episode",
      slug: "episode",
      videoId: "abc123xyz",
    });
  });

  it("returns null when neither audio nor a playable youtube source exists", () => {
    expect(
      buildPlaybackTrack({
        title: "Episode",
        slug: "episode",
        sourceType: "RSS",
        sourceUrl: "https://example.com/episode",
        audioUrl: null,
      }),
    ).toBeNull();
  });
});
