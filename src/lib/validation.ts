import { z } from "zod";

export const importRequestSchema = z.object({
  sourceType: z.enum(["RSS", "YOUTUBE", "PODCAST", "PRANKCAST", "LOCAL"]),
  sourceUrl: z.string().url(),
});

export const transcriptCorrectionSchema = z.object({
  segmentId: z.string().min(1),
  text: z.string().min(1),
  speaker: z.string().optional(),
});
