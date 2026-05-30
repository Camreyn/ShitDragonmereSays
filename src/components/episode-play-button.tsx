"use client";

import { buildPlaybackTrack } from "@/lib/playback";
import { useAudioPlayer } from "./audio-player-provider";

type EpisodePlayButtonProps = {
  episode: {
    slug: string;
    title: string;
    sourceType: "RSS" | "YOUTUBE" | "PODCAST" | "PRANKCAST" | "LOCAL";
    sourceUrl: string;
    audioUrl: string | null;
  };
  startAt?: number;
};

export function EpisodePlayButton({ episode, startAt = 0 }: EpisodePlayButtonProps) {
  const { setTrack, track, seekTo } = useAudioPlayer();
  const playbackTrack = buildPlaybackTrack(episode);

  if (!playbackTrack) {
    return (
      <a
        href={episode.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
      >
        Open source
      </a>
    );
  }

  return (
    <button
      onClick={() => {
        if (track?.slug === episode.slug) {
          seekTo(startAt);
          return;
        }

        setTrack(playbackTrack, startAt);
      }}
      className="inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
    >
      Play episode
    </button>
  );
}
