"use server";

import { revalidatePath } from "next/cache";
import { importPodcastFeed, importYoutubeMetadata } from "../importers";
import { prisma } from "../prisma";
import { redactSensitiveText } from "../redaction";
import { importRequestSchema, transcriptCorrectionSchema } from "../validation";

export async function createImportJob(formData: FormData) {
  const payload = importRequestSchema.parse({
    sourceType: formData.get("sourceType"),
    sourceUrl: formData.get("sourceUrl"),
  });

  const job = await prisma.adminImportJob.create({ data: payload });

  try {
    await prisma.adminImportJob.update({ where: { id: job.id }, data: { status: "RUNNING" } });

    if (payload.sourceType === "RSS" || payload.sourceType === "PODCAST" || payload.sourceType === "PRANKCAST") {
      await importPodcastFeed(payload.sourceUrl);
    }

    if (payload.sourceType === "YOUTUBE") {
      await importYoutubeMetadata(payload.sourceUrl);
    }

    await prisma.adminImportJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED" } });
  } catch (error) {
    await prisma.adminImportJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unknown import failure" },
    });
  }

  revalidatePath("/admin/import");
  revalidatePath("/episodes");
}

export async function updateTranscriptSegment(formData: FormData) {
  const payload = transcriptCorrectionSchema.parse({
    segmentId: formData.get("segmentId"),
    speaker: formData.get("speaker") || undefined,
    text: formData.get("text"),
  });

  const redactedText = redactSensitiveText(payload.text);
  const segment = await prisma.transcriptSegment.update({
    where: { id: payload.segmentId },
    data: {
      speaker: payload.speaker,
      text: payload.text,
      redactedText,
      searchText: `${payload.speaker ?? ""} ${redactedText}`.trim(),
    },
    include: { episode: true },
  });

  revalidatePath(`/episode/${segment.episode.slug}`);
  revalidatePath(`/admin/episodes/${segment.episodeId}`);
}

export async function runTranscriptRedaction(formData: FormData) {
  const episodeId = String(formData.get("episodeId"));
  const segments = await prisma.transcriptSegment.findMany({ where: { episodeId } });

  await Promise.all(
    segments.map((segment) => {
      const redactedText = redactSensitiveText(segment.text);
      return prisma.transcriptSegment.update({
        where: { id: segment.id },
        data: { redactedText, searchText: `${segment.speaker ?? ""} ${redactedText}`.trim() },
      });
    }),
  );

  revalidatePath(`/admin/episodes/${episodeId}`);
}
