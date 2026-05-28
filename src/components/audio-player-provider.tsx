"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type PlayerTrack = {
  title: string;
  audioUrl: string;
  slug: string;
};

type AudioPlayerContextValue = {
  track: PlayerTrack | null;
  currentTime: number;
  isPlaying: boolean;
  setTrack: (track: PlayerTrack, startAt?: number) => void;
  seekTo: (seconds: number) => void;
  toggle: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrackState] = useState<PlayerTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const setTrack = (nextTrack: PlayerTrack, startAt = 0) => {
    setTrackState(nextTrack);
    requestAnimationFrame(() => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = startAt;
      void audioRef.current.play();
    });
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds;
  };

  const toggle = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      void audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [track]);

  const value = useMemo(() => ({ track, currentTime, isPlaying, setTrack, seekTo, toggle }), [track, currentTime, isPlaying]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <PersistentAudioPlayer audioRef={audioRef} track={track} currentTime={currentTime} isPlaying={isPlaying} toggle={toggle} />
    </AudioPlayerContext.Provider>
  );
}

function PersistentAudioPlayer({
  audioRef,
  track,
  currentTime,
  isPlaying,
  toggle,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  track: PlayerTrack | null;
  currentTime: number;
  isPlaying: boolean;
  toggle: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[color:rgba(14,16,19,0.94)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button
          onClick={toggle}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
          disabled={!track}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{track ? track.title : "Select an episode to start listening"}</p>
          <p className="truncate text-xs text-[var(--muted)]">
            Timestamp sync stays active while you browse transcripts and quotes.
          </p>
        </div>
        <span className="text-sm tabular-nums text-[var(--muted)]">{Math.floor(currentTime)}s</span>
        <audio ref={audioRef} src={track?.audioUrl} preload="metadata" className="w-[38%] min-w-[180px]" controls />
      </div>
    </div>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return context;
}
