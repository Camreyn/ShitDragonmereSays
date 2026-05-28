import { describe, expect, it } from "vitest";
import { parseSrt, parseTranscriptJson, parseVtt } from "@/lib/transcript";

describe("transcript import parsing", () => {
  it("parses json transcripts", () => {
    const input = JSON.stringify([{ startSeconds: 0, endSeconds: 3, speaker: "host", text: "hello" }]);
    expect(parseTranscriptJson(input)[0].searchText).toContain("hello");
  });

  it("parses srt transcripts", () => {
    const input = "1\n00:00:01,000 --> 00:00:03,000\nhello world";
    expect(parseSrt(input)[0].startSeconds).toBe(1);
  });

  it("parses vtt transcripts", () => {
    const input = "WEBVTT\n\n00:00:02.000 --> 00:00:04.000\ncorn down";
    expect(parseVtt(input)[0].redactedText).toBe("corn down");
  });
});
