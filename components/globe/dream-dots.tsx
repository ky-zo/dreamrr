"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useDreamStore } from "@/components/dream-store";
import { formatPrice } from "@/lib/dreams";
import { projectLatLng } from "@/lib/globe-projection";
import type { GlobeRotation } from "./rotation";

type Props = { rotation: RefObject<GlobeRotation> };

export function DreamDots({ rotation }: Props) {
  const { dreams, hoveredId, highlightedId, setHoveredId, select, isOwned } =
    useDreamStore();
  const dots = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    let raf = requestAnimationFrame(function frame() {
      raf = requestAnimationFrame(frame);
      const { size, phi, theta } = rotation.current;
      if (!size) return;
      for (const dream of dreams) {
        const el = dots.current.get(dream.id);
        if (!el) continue;
        const p = projectLatLng(dream.lat, dream.lng, size, phi, theta);
        if (!p.visible) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          continue;
        }
        el.style.opacity = String(Math.min(1, p.facing * 2.2));
        el.style.pointerEvents = "auto";
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${
          0.7 + p.facing * 0.3
        })`;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [dreams, rotation]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {dreams.map((dream) => {
        const owned = isOwned(dream.id);
        /* Pointed at by the assistant: marked whether or not it's hovered. */
        const marked = highlightedId === dream.id;
        const active = hoveredId === dream.id || marked;
        /* Still-only dreams (no video) get their own colour so they read apart from the rest. */
        const still = dream.video === null;
        return (
          <button
            key={dream.id}
            type="button"
            ref={(el) => {
              if (el) dots.current.set(dream.id, el);
              else dots.current.delete(dream.id);
            }}
            style={{ opacity: 0 }}
            className="absolute left-0 top-0 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dream"
            aria-label={`${dream.title} — ${formatPrice(dream.price)}`}
            onPointerEnter={() => setHoveredId(dream.id)}
            onPointerLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(dream.id)}
            onBlur={() => setHoveredId(null)}
            onClick={() => select(dream.id)}
          >
            {/* The ring only exists for the recommended dream, and it breathes. */}
            {marked ? (
              <span
                className={`absolute h-5 w-5 animate-ping rounded-full ${still ? "bg-still/25" : "bg-dream/25"}`}
              />
            ) : null}
            <span
              className={[
                "relative rounded-full transition-[width,height,box-shadow] duration-150",
                marked ? "h-[11px] w-[11px]" : active ? "h-[9px] w-[9px]" : "h-[7px] w-[7px]",
                owned
                  ? "border border-line-strong bg-paper-sunk"
                  : still
                    ? "bg-still"
                    : "bg-dream",
                marked
                  ? still
                    ? "shadow-[0_0_0_5px_rgba(255,157,46,0.3)]"
                    : "shadow-[0_0_0_5px_rgba(212,50,28,0.3)]"
                  : active
                    ? still
                      ? "shadow-[0_0_0_3px_rgba(255,157,46,0.22)]"
                      : "shadow-[0_0_0_3px_rgba(212,50,28,0.22)]"
                    : "",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
