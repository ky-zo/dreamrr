"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useDreamStore } from "@/components/dream-store";
import { DreamImage, PlayBadge } from "@/components/media";
import { formatPrice } from "@/lib/dreams";
import { projectLatLng } from "@/lib/globe-projection";
import type { GlobeRotation } from "./rotation";

type Props = { rotation: RefObject<GlobeRotation> };

/** Posters are shot vertical, so the hover card is a poster with a caption. */
const CARD_W = 208;
const GAP = 18;

export function DreamPopover({ rotation }: Props) {
  const { dreams, hoveredId, selectedId } = useDreamStore();
  // The panel owns the screen once a dream is open — don't stack a card on it.
  const dream =
    selectedId === null ? (dreams.find((d) => d.id === hoveredId) ?? null) : null;
  const anchorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dream) return;
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;

    const height = card.offsetHeight;
    let shown = false;
    let raf = requestAnimationFrame(function frame() {
      raf = requestAnimationFrame(frame);
      const { size, phi, theta } = rotation.current;
      const p = projectLatLng(dream.lat, dream.lng, size, phi, theta);
      const flip = p.x + GAP + CARD_W > size;
      const x = Math.max(0, flip ? p.x - GAP - CARD_W : p.x + GAP);
      const y = Math.max(0, Math.min(size - height, p.y - height / 2));
      anchor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!shown) {
        shown = true;
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [dream, rotation]);

  if (!dream) return null;

  return (
    <div ref={anchorRef} className="pointer-events-none absolute left-0 top-0 z-20">
      <div
        ref={cardRef}
        style={{ opacity: 0, transform: "scale(0.97)", width: CARD_W }}
        className="overflow-hidden rounded-md border border-line bg-paper-raised shadow-[0_1px_3px_rgba(23,21,15,0.07)] transition-[opacity,transform] duration-[120ms]"
      >
        <div className="relative aspect-[2/3] w-full bg-paper-sunk">
          <DreamImage
            src={dream.image}
            alt={dream.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute right-2 top-2 rounded-sm bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] text-white">
            {formatPrice(dream.price)}
          </span>
          {dream.video ? (
            <div className="absolute bottom-2 left-2">
              <PlayBadge />
            </div>
          ) : null}
        </div>
        <div className="border-t border-line p-2.5">
          <p className="truncate text-sm font-medium leading-snug">{dream.title}</p>
          <p className="meta mt-0.5 truncate">
            {dream.location} · {dream.durationMin} min
          </p>
          <p className="meta mt-1.5 text-ink">
            {dream.video ? "Click to play trailer" : "Click for details"}
          </p>
        </div>
      </div>
    </div>
  );
}
