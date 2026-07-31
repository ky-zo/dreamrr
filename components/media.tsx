"use client";

import { useEffect, useRef, useState } from "react";

type ImgProps = { src: string; alt: string; className?: string };

export function DreamImage({ src, alt, className = "" }: ImgProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`bg-paper-sunk ${className}`}>
        <div className="h-full w-full border border-line" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function Avatar({ src, alt, className = "" }: ImgProps) {
  const [failed, setFailed] = useState(false);
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-paper-sunk text-[10px] font-medium text-ink-faint ${className}`}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

type DreamMediaProps = {
  poster: string;
  video: string | null;
  alt: string;
  /** When true, fade the video in over the poster. Driven by the caller's hover/selected state. */
  active: boolean;
  className?: string;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Poster first, always. The clip loads only once the card first goes active and
 * fades in over the poster once it genuinely has frames to show.
 */
export function DreamMedia({ poster, video, alt, active, className = "" }: DreamMediaProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!video || prefersReducedMotion()) return;
    const el = ref.current;
    if (!active) {
      el?.pause();
      return;
    }
    // First activation: attach the src and let the next pass start playback.
    if (!src) {
      setSrc(video);
      return;
    }
    el?.play().catch(() => {});
  }, [active, video, src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Poster src={poster} alt={alt} />
      {video ? (
        <video
          ref={ref}
          src={src ?? undefined}
          muted
          playsInline
          loop
          preload="none"
          aria-hidden
          onCanPlay={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[450ms] ${
            active && ready ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}

type TrailerProps = {
  poster: string;
  video: string | null;
  alt: string;
  className?: string;
};

/**
 * The panel's player. Starts the trailer as soon as the dream opens — muted,
 * because browsers demand it — and offers sound as a one-tap choice.
 */
export function DreamTrailer({ poster, video, alt, className = "" }: TrailerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  // A new dream means a new clip: reset before it gets a chance to show a
  // stale frame under the new poster.
  useEffect(() => {
    setReady(false);
    setPlaying(!prefersReducedMotion());
  }, [video]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, ready]);

  if (!video) {
    return (
      <div className={`relative ${className}`}>
        <Poster src={poster} alt={alt} />
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      <Poster src={poster} alt={alt} />
      <video
        ref={ref}
        src={video}
        muted={muted}
        playsInline
        loop
        autoPlay
        preload="auto"
        aria-label={`${alt} trailer`}
        onCanPlay={() => setReady(true)}
        onLoadedData={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[450ms] ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Click the frame to pause, click again to resume. */}
      <button
        type="button"
        aria-label={playing ? "Pause trailer" : "Play trailer"}
        onClick={() => setPlaying((p) => !p)}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-ink/70 transition-opacity duration-150 ${
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <svg viewBox="0 0 12 12" aria-hidden className="h-3.5 w-3.5 fill-white">
            {playing ? (
              <path d="M2 1h3v10H2zM7 1h3v10H7z" />
            ) : (
              <path d="M3 1 10.5 6 3 11Z" />
            )}
          </svg>
        </span>
      </button>

      <button
        type="button"
        aria-label={muted ? "Unmute trailer" : "Mute trailer"}
        onClick={() => setMuted((m) => !m)}
        className="absolute bottom-2 right-2 flex h-[26px] items-center gap-1 rounded-sm bg-ink/75 px-2 text-[11px] font-medium text-white transition-colors hover:bg-ink"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>

      {!ready ? (
        <span className="meta absolute bottom-2 left-2 rounded-sm bg-ink/75 px-1.5 py-0.5 text-white">
          Loading…
        </span>
      ) : null}
    </div>
  );
}

function Poster({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="absolute inset-0 bg-paper-sunk" />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/** 22px marker for cards that carry footage. Position it from the caller. */
export function PlayBadge() {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink/80">
      <svg viewBox="0 0 10 10" aria-hidden className="h-[9px] w-[9px] fill-white">
        <path d="M2.5 1 8 5 2.5 9Z" />
      </svg>
    </span>
  );
}
