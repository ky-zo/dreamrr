"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useDreamStore } from "@/components/dream-store";
import { DreamMedia, PlayBadge } from "@/components/media";
import { formatPrice } from "@/lib/dreams";
import { projectLatLng } from "@/lib/globe-projection";
import type { GlobeRotation } from "./rotation";

type Props = { rotation: RefObject<GlobeRotation> };

const CARD_W = 280;
const GAP = 18;

export function DreamPopover({ rotation }: Props) {
  const { dreams, hoveredId } = useDreamStore();
  const dream = dreams.find((d) => d.id === hoveredId) ?? null;
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
        style={{ opacity: 0, transform: "scale(0.97)" }}
        className="w-[280px] overflow-hidden rounded-md border border-line bg-paper-raised shadow-[0_1px_3px_rgba(23,21,15,0.07)] transition-[opacity,transform] duration-[120ms]"
      >
        <div className="relative">
          <DreamMedia
            poster={dream.image}
            video={dream.video}
            alt={dream.title}
            active
            className="aspect-video w-full bg-paper-sunk"
          />
          {dream.video ? (
            <div className="absolute bottom-0 left-0 m-2">
              <PlayBadge />
            </div>
          ) : null}
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{dream.title}</span>
            <span className="meta shrink-0 text-ink">{formatPrice(dream.price)}</span>
          </div>
          <div className="meta mt-1 truncate">
            {dream.location} · {dream.durationMin} min
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{dream.description}</p>
        </div>
      </div>
    </div>
  );
}
