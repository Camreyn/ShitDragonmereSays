import { z } from "zod";
import { redactSensitiveText } from "./redaction";

const transcriptSegmentSchema = z.object({
  startSeconds: z.number().int().nonnegative(),
  endSeconds: z.number().int().nonnegative(),
  speaker: z.string().min(1).optional().nullable(),
  text: z.string().min(1),
});

export type ImportedTranscriptSegment = z.infer<typeof transcriptSegmentSchema> & {
  redactedText: string;
  searchText: string;
};

function normalizeSegment(segment: z.infer<typeof transcriptSegmentSchema>): ImportedTranscriptSegment {
  const redactedText = redactSensitiveText(segment.text);
  return {
    ...segment,
    redactedText,
    searchText: `${segment.speaker ?? ""} ${redactedText}`.trim(),
  };
}

export function parseTranscriptJson(input: string) {
  const payload = z.array(transcriptSegmentSchema).parse(JSON.parse(input));
  return payload.map(normalizeSegment);
}

function timecodeToSeconds(timecode: string) {
  const clean = timecode.replace(",", ".");
  const [clock] = clean.split(".");
  const parts = clock.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export function parseSrt(input: string) {
  const chunks = input.trim().split(/\r?\n\r?\n/);
  return chunks
    .map((chunk) => chunk.trim().split(/\r?\n/))
    .filter((lines) => lines.length >= 3)
    .map((lines) => {
      const [start, end] = lines[1].split(" --> ");
      return normalizeSegment({
        startSeconds: timecodeToSeconds(start),
        endSeconds: timecodeToSeconds(end),
        speaker: undefined,
        text: lines.slice(2).join(" ").trim(),
      });
    });
}

export function parseVtt(input: string) {
  const cleaned = input.replace(/^WEBVTT\s*/i, "").trim();
  const chunks = cleaned.split(/\r?\n\r?\n/);
  return chunks
    .map((chunk) => chunk.trim().split(/\r?\n/))
    .filter((lines) => lines.length >= 2 && lines.some((line) => line.includes(" --> ")))
    .map((lines) => {
      const timeLine = lines.find((line) => line.includes(" --> ")) ?? "";
      const [start, end] = timeLine.split(" --> ");
      return normalizeSegment({
        startSeconds: timecodeToSeconds(start),
        endSeconds: timecodeToSeconds(end),
        speaker: undefined,
        text: lines.filter((line) => line !== timeLine).join(" ").trim(),
      });
    });
}
