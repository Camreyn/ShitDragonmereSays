"use client";

import { useMemo } from "react";
import { formatTimestamp } from "@/lib/timestamps";
import { useAudioPlayer } from "./audio-player-provider";
import { HighlightedText } from "./highlighted-text";

type Segment = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speaker: string | null;
  redactedText: string;
};

type TranscriptViewerProps = {
  episode: {
    slug: string;
    title: string;
    audioUrl: string | null;
  };
  segments: Segment[];
  query?: string;
  startAt?: number;
};

export function TranscriptViewer({ episode, segments, query, startAt = 0 }: TranscriptViewerProps) {
  const { currentTime, setTrack, seekTo, track } = useAudioPlayer();

  const activeId = useMemo(
    () => segments.find((segment) => currentTime >= segment.startSeconds && currentTime < segment.endSeconds)?.id,
    [currentTime, segments],
  );

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={`grid gap-3 rounded-2xl border px-4 py-3 md:grid-cols-[120px_120px_1fr_auto] ${
            activeId === segment.id ? "border-[var(--accent)] bg-[color:rgba(241,196,15,0.12)]" : "border-[var(--line)] bg-[var(--panel-strong)]"
          }`}
        >
          <button
            onClick={() => {
              if (episode.audioUrl) {
                if (track?.slug !== episode.slug) {
                  setTrack({ title: episode.title, audioUrl: episode.audioUrl, slug: episode.slug }, segment.startSeconds || startAt);
                } else {
                  seekTo(segment.startSeconds);
                }
              }
              window.history.replaceState(null, "", `/episode/${episode.slug}?t=${formatTimestamp(segment.startSeconds)}`);
            }}
            className="text-left font-mono text-sm text-[var(--accent)]"
          >
            {formatTimestamp(segment.startSeconds)}
          </button>
          <span className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">{segment.speaker ?? "unknown"}</span>
          <p className="leading-7 text-[var(--text)]">
            <HighlightedText text={segment.redactedText} query={query} />
          </p>
          <CopyQuoteButton slug={episode.slug} startSeconds={segment.startSeconds} text={segment.redactedText} />
        </div>
      ))}
    </div>
  );
}

function CopyQuoteButton({ slug, startSeconds, text }: { slug: string; startSeconds: number; text: string }) {
  return (
    <button
      onClick={async () => {
        const url = `${window.location.origin}/episode/${slug}?t=${formatTimestamp(startSeconds)}`;
        await navigator.clipboard.writeText(`"${text}" ${url}`);
      }}
      className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
    >
      Copy link
    </button>
  );
}
