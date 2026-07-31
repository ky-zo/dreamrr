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

export function GlobeStage() {
  const { registerGlobeFocus, selectedId } = useDreamStore();
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
        className={`meta pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-700 ease-out ${
          entered ? "opacity-100 delay-500" : "opacity-0"
        }`}
      >
        Drag to spin · Hover a dot to preview · Click to play the trailer
      </p>
    </div>
  );
}
