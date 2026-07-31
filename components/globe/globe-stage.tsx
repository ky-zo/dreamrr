"use client";

import { useEffect, useRef, useState } from "react";
import { useDreamStore } from "@/components/dream-store";
import { useIntro } from "@/components/intro-gate";
import {
  phiForLongitude,
  shortestAngleDelta,
  thetaForLatitude,
} from "@/lib/globe-projection";
import { DreamArc } from "./dream-arc";
import { DreamDots } from "./dream-dots";
import { DreamPopover } from "./dream-popover";
import { GlobeCanvas } from "./globe-canvas";
import { createRotation, type GlobeRotation } from "./rotation";
import { Stars } from "./stars";

const MAX_SIZE = 760;
const MIN_SIZE = 280;
const FOCUS_MS = 700;

/** How long the globe waits before it tells you what to do with it. */
const HINT_DELAY_MS = 3500;

export function GlobeStage() {
  const { registerGlobeFocus, selectedId, hoveredId } = useDreamStore();
  const { entered } = useIntro();
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

  /**
   * The dots are small and nobody has been told they're hoverable, so if a
   * little while goes by after entering without a single dot under the pointer,
   * say it out loud. Hovering one retires the hint for good.
   */
  const [everHovered, setEverHovered] = useState(false);
  const [hintDue, setHintDue] = useState(false);

  useEffect(() => {
    if (hoveredId) setEverHovered(true);
  }, [hoveredId]);

  useEffect(() => {
    if (!entered || everHovered) return;
    const id = setTimeout(() => setHintDue(true), HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [entered, everHovered]);

  const showHint = hintDue && !everHovered;

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
      <Stars />
      {size > 0 && (
        <div
          /* Shrunken and inert during the intro; the globe keeps spinning
             underneath, it's just small and not yours to touch yet. */
          className={`absolute left-1/2 top-1/2 transition-transform duration-[900ms] ease-out ${
            entered ? "" : "pointer-events-none"
          }`}
          style={{
            width: size,
            height: size,
            transform: `translate(-50%, -50%) scale(${entered ? 1 : 0.42})`,
          }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          {/* An open dream holds the globe still too, so it doesn't drift out
              from under the panel while you're reading. */}
          <GlobeCanvas rotation={rotation} size={size} hovered={hovered || selectedId !== null} />
          <DreamArc rotation={rotation} />
          <DreamDots rotation={rotation} />
          <DreamPopover rotation={rotation} />
        </div>
      )}
      <p
        className={`pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full border border-dream/40 bg-paper-raised/90 px-4 py-2 text-xs text-dream shadow-[0_1px_12px_rgba(23,21,15,0.08)] backdrop-blur-sm transition-all duration-500 ease-out ${
          showHint ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-hidden={!showHint}
      >
        <span className="mr-2 inline-block h-1.5 w-1.5 animate-ping rounded-full bg-dream align-middle" />
        Hover over the red dot on the globe
      </p>
      <p
        className={`meta pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-700 ease-out ${
          entered ? "opacity-100 delay-500" : "opacity-0"
        }`}
      >
        Drag to spin · Hover a dot to preview · Click to play the trailer
      </p>
    </div>
  );
}
