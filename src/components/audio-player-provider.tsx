"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PlaybackTrack } from "@/lib/playback";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          height?: string;
          width?: string;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YoutubePlayer }) => void;
            onStateChange?: (event: { data: number; target: YoutubePlayer }) => void;
          };
        },
      ) => YoutubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YoutubePlayer = {
  destroy: () => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
};

type AudioPlayerContextValue = {
  track: PlaybackTrack | null;
  currentTime: number;
  isPlaying: boolean;
  setTrack: (track: PlaybackTrack, startAt?: number) => void;
  seekTo: (seconds: number) => void;
  toggle: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);
const YOUTUBE_PLAYER_ELEMENT_ID = "persistent-youtube-player";

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("YouTube API requires a browser"));
  if (window.YT?.Player) return Promise.resolve(window.YT);

  return new Promise<typeof window.YT>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    const handleReady = () => resolve(window.YT);

    window.onYouTubeIframeAPIReady = handleReady;

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("Failed to load the YouTube iframe API"));
      document.head.appendChild(script);
    }
  });
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<YoutubePlayer | null>(null);
  const youtubeReadyRef = useRef(false);
  const requestedStartRef = useRef(0);
  const [track, setTrackState] = useState<PlaybackTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeVideoId = track?.kind === "youtube" ? track.videoId : null;

  const setTrack = (nextTrack: PlaybackTrack, startAt = 0) => {
    requestedStartRef.current = startAt;
    setCurrentTime(startAt);
    setTrackState(nextTrack);

    requestAnimationFrame(() => {
      if (nextTrack.kind === "audio" && audioRef.current) {
        youtubePlayerRef.current?.pauseVideo();
        audioRef.current.currentTime = startAt;
        void audioRef.current.play();
      }

      if (nextTrack.kind === "youtube" && youtubePlayerRef.current && youtubeReadyRef.current) {
        audioRef.current?.pause();
        youtubePlayerRef.current.loadVideoById(nextTrack.videoId, startAt);
      }
    });
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (track?.kind === "audio" && audioRef.current) {
      audioRef.current.currentTime = seconds;
    }

    if (track?.kind === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(seconds, true);
    }
  };

  const toggle = () => {
    if (!track) return;

    if (track.kind === "audio" && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }

    if (track.kind === "youtube" && youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (track?.kind !== "youtube" || !youtubeVideoId) {
      youtubePlayerRef.current?.pauseVideo();
      return;
    }

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !YT) return;

        if (!youtubePlayerRef.current) {
          youtubePlayerRef.current = new YT.Player(YOUTUBE_PLAYER_ELEMENT_ID, {
            height: "90",
            width: "160",
            videoId: youtubeVideoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
            },
            events: {
              onReady: (event) => {
                youtubeReadyRef.current = true;
                event.target.loadVideoById(youtubeVideoId, requestedStartRef.current);
              },
              onStateChange: (event) => {
                setIsPlaying(event.data === YT.PlayerState.PLAYING);
              },
            },
          });
        } else if (youtubeReadyRef.current) {
          youtubePlayerRef.current.loadVideoById(youtubeVideoId, requestedStartRef.current);
        }

        intervalId = setInterval(() => {
          if (youtubePlayerRef.current) {
            setCurrentTime(youtubePlayerRef.current.getCurrentTime());
          }
        }, 500);
      })
      .catch(() => {
        setIsPlaying(false);
      });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [track?.kind, youtubeVideoId]);

  useEffect(() => {
    return () => {
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ track, currentTime, isPlaying, setTrack, seekTo, toggle }}>
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
  track: PlaybackTrack | null;
  currentTime: number;
  isPlaying: boolean;
  toggle: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[color:rgba(14,16,19,0.94)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <button
          onClick={toggle}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!track}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{track ? track.title : "Select an episode to start listening"}</p>
          <p className="truncate text-xs text-[var(--muted)]">
            {track?.kind === "youtube" ? "YouTube playback is active with timestamp sync." : "Timestamp sync stays active while you browse transcripts and quotes."}
          </p>
        </div>
        <span className="text-sm tabular-nums text-[var(--muted)]">{Math.floor(currentTime)}s</span>
        <audio
          ref={audioRef}
          src={track?.kind === "audio" ? track.audioUrl : undefined}
          preload="metadata"
          className={track?.kind === "audio" ? "w-[38%] min-w-[180px]" : "hidden"}
          controls={track?.kind === "audio"}
        />
        <div className={track?.kind === "youtube" ? "h-[90px] w-[160px] overflow-hidden rounded-xl border border-[var(--line)]" : "hidden"}>
          <div id={YOUTUBE_PLAYER_ELEMENT_ID} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return context;
}
