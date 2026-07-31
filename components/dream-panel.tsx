"use client";

import { useEffect, useState } from "react";
import { BuyButton } from "@/components/buy-button";
import { useDreamStore } from "@/components/dream-store";
import { DreamReviews } from "@/components/dream-reviews";
import { Avatar, DreamTrailer } from "@/components/media";

export function DreamPanel() {
  const { dreams, selectedId, select } = useDreamStore();
  const dream = dreams.find((d) => d.id === selectedId) ?? null;
  const [shown, setShown] = useState(false);
  // Hovering the trailer widens the whole panel, so the clip grows without
  // spilling past the panel's own clipping edge.
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setZoomed(false);
    if (!dream) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [dream]);

  useEffect(() => {
    if (!dream) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dream, select]);

  if (!dream) return null;

  return (
    <aside
      className={`absolute bottom-6 left-6 top-6 z-30 flex flex-col overflow-y-auto rounded-lg border border-line bg-paper-raised shadow-[0_1px_12px_rgba(23,21,15,0.06)] transition-all duration-[280ms] ${
        zoomed ? "w-[min(1100px,82vw)]" : "w-[340px]"
      } ${shown ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"}`}
    >
      <button
        type="button"
        aria-label="Close (Esc)"
        title="Close (Esc)"
        onClick={() => select(null)}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-base leading-none text-white transition-colors hover:bg-ink"
      >
        ×
      </button>

      <div
        onMouseEnter={() => dream.video && setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <DreamTrailer
          key={dream.id}
          poster={dream.image}
          video={dream.video}
          alt={dream.title}
          className="aspect-video w-full shrink-0 overflow-hidden rounded-t-lg bg-paper-sunk"
        />
      </div>

      <div className="p-5">
        <h2 className="text-lg font-medium leading-snug">{dream.title}</h2>
        <p className="meta mt-1">
          {dream.location} · {dream.recordedAt}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{dream.description}</p>
      </div>

      <div className="grid grid-cols-2 border-t border-line">
        <div className="border-r border-line p-5">
          <p className="meta">Duration</p>
          <p className="mt-1 font-mono text-sm text-ink">{dream.durationMin} min</p>
        </div>
        <div className="p-5">
          <p className="meta">Vividness</p>
          <p className="mt-1 font-mono text-sm text-ink">{dream.vividness}/10</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-line p-5">
        {dream.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-line px-2 py-0.5 text-[11px] text-ink-soft"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="border-t border-line p-5">
        <div className="flex items-center gap-3">
          <Avatar
            src={dream.seller.avatar}
            alt={dream.seller.name}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">{dream.seller.name}</p>
            <p className="meta">{dream.seller.handle}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">{dream.seller.bio}</p>
        <p className="meta mt-3">
          {dream.seller.dreamsSold} sold · {dream.seller.rating}★ · since {dream.seller.joined}
        </p>
      </div>

      <DreamReviews dream={dream} />

      <div className="sticky bottom-0 mt-auto border-t border-line bg-paper-raised p-5">
        <BuyButton dream={dream} />
      </div>
    </aside>
  );
}
