"use client";

import { useEffect, useRef, useState } from "react";
import { useDreamStore } from "@/components/dream-store";
import {
  phiForLongitude,
  shortestAngleDelta,
  thetaForLatitude,
} from "@/lib/globe-projection";
import { DreamDots } from "./dream-dots";
import { DreamPopover } from "./dream-popover";
import { GlobeCanvas } from "./globe-canvas";
import { createRotation, type GlobeRotation } from "./rotation";

const MAX_SIZE = 760;
const MIN_SIZE = 280;
const FOCUS_MS = 700;

export function GlobeStage() {
  const { registerGlobeFocus, selectedId } = useDreamStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const rotation = useRef<GlobeRotation>(createRotation());
  const [size, setSize] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = Math.round(Math.max(MIN_SIZE, Math.min(width, height, MAX_SIZE)));
      rotation.current.size = next;
      setSize(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    registerGlobeFocus((dream) => {
      cancelAnimationFrame(raf);
      const fromPhi = rotation.current.phi;
      const fromTheta = rotation.current.theta;
      const dPhi = shortestAngleDelta(fromPhi, phiForLongitude(dream.lng));
      const dTheta = shortestAngleDelta(fromTheta, thetaForLatitude(dream.lat));
      const start = performance.now();
      raf = requestAnimationFrame(function step(now) {
        const t = Math.min(1, (now - start) / FOCUS_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        rotation.current.phi = fromPhi + dPhi * eased;
        rotation.current.theta = fromTheta + dTheta * eased;
        if (t < 1) raf = requestAnimationFrame(step);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [registerGlobeFocus]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {size > 0 && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: size, height: size }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          {/* A soft bloom under the globe so the white sphere lifts off the
              paper instead of being cut out of it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[14%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 42%, rgba(255,255,255,0.45) 58%, rgba(255,255,255,0) 72%)",
            }}
          />
          {/* An open dream holds the globe still too, so it doesn't drift out
              from under the panel while you're reading. */}
          <GlobeCanvas rotation={rotation} size={size} hovered={hovered || selectedId !== null} />
          <DreamDots rotation={rotation} />
          <DreamPopover rotation={rotation} />
        </div>
      )}
      <p className="meta pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
        Drag to spin · Hover a dot
      </p>
    </div>
  );
}
