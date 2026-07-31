"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useDreamStore } from "@/components/dream-store";
import {
  GLOBE_RADIUS,
  distanceKm,
  greatCircle,
  projectVector,
  type Vec3,
} from "@/lib/globe-projection";
import type { GlobeRotation } from "./rotation";

type Props = { rotation: RefObject<GlobeRotation> };

/** Points along the arc. Enough that the curve reads as smooth at 760px. */
const STEPS = 160;
/** How long the line takes to travel from you to the dream. */
const DRAW_MS = 900;
/** Peak height of the arc above the surface, as a fraction of the radius. */
const LIFT = 0.5;
/**
 * How much of that lift a zero-distance hop still gets. Without a floor, dreams
 * near you would draw a flat scratch on the surface instead of a jump.
 */
const MIN_BOW = 0.4;

export function DreamArc({ rotation }: Props) {
  const { dreams, selectedId, viewer } = useDreamStore();
  const dream = selectedId ? (dreams.find((d) => d.id === selectedId) ?? null) : null;

  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const homeRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  /**
   * The arc in space. It doesn't depend on the rotation at all — spinning the
   * globe only changes where these fixed points land on screen — so it's built
   * once per dream rather than every frame.
   */
  const arc = useMemo(() => {
    if (!viewer || !dream) return null;
    const points = greatCircle(viewer, dream, STEPS);
    // A hop across a country shouldn't balloon as far off the surface as a hop
    // across the planet, so the bow scales with how far apart the ends are.
    const span = Math.acos(
      Math.max(-1, Math.min(1, dotProduct(points[0], points[STEPS]))),
    );
    const bow = MIN_BOW + (1 - MIN_BOW) * Math.min(1, span / Math.PI);
    return {
      points,
      radii: points.map(
        (_, i) => GLOBE_RADIUS * (1 + LIFT * bow * Math.sin((i / STEPS) * Math.PI)),
      ),
      km: distanceKm(viewer, dream),
    };
  }, [viewer, dream]);

  useEffect(() => {
    if (!arc) return;
    const path = pathRef.current;
    const glow = glowRef.current;
    const head = headRef.current;
    const home = homeRef.current;
    const label = labelRef.current;
    if (!path || !glow || !head || !home || !label) return;

    const start = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      raf = requestAnimationFrame(frame);
      const { size, phi, theta } = rotation.current;
      if (!size) return;

      const t = Math.min(1, (now - start) / DRAW_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const drawn = Math.max(1, Math.round(eased * STEPS));

      // One pass, building the drawn part of the line. The far side of the
      // globe is simply left out — the line disappears round the horizon and
      // comes back, which is what makes it read as wrapping a sphere.
      let d = "";
      let penDown = false;
      let headPoint: { x: number; y: number } | null = null;
      for (let i = 0; i <= drawn; i++) {
        const p = projectVector(arc.points[i], arc.radii[i], size, phi, theta);
        if (!p.visible) {
          penDown = false;
          continue;
        }
        d += `${penDown ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        penDown = true;
        if (i === drawn) headPoint = p;
      }

      path.setAttribute("d", d);
      glow.setAttribute("d", d);

      // The bead riding the tip while it travels, gone once it has arrived.
      if (headPoint && t < 1) {
        head.setAttribute("cx", String(headPoint.x));
        head.setAttribute("cy", String(headPoint.y));
        head.style.opacity = "1";
      } else {
        head.style.opacity = "0";
      }

      const origin = projectVector(arc.points[0], GLOBE_RADIUS, size, phi, theta);
      home.setAttribute("cx", String(origin.x));
      home.setAttribute("cy", String(origin.y));
      home.style.opacity = origin.visible ? String(Math.min(1, origin.facing * 2.2)) : "0";
      label.style.transform = `translate3d(${origin.x + 12}px, ${origin.y - 9}px, 0)`;
      label.style.opacity = origin.visible ? String(Math.min(1, origin.facing * 2.2) * eased) : "0";
    });
    return () => cancelAnimationFrame(raf);
  }, [arc, rotation]);

  if (!arc || !viewer) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <path
          ref={glowRef}
          fill="none"
          stroke="var(--color-dream)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.16}
        />
        <path
          ref={pathRef}
          fill="none"
          stroke="var(--color-dream)"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.95}
        />
        <circle ref={headRef} r={3} fill="var(--color-dream)" style={{ opacity: 0 }} />
        <circle
          ref={homeRef}
          r={3.5}
          fill="none"
          stroke="var(--color-dream)"
          strokeWidth={1.4}
          style={{ opacity: 0 }}
        />
      </svg>
      <div
        ref={labelRef}
        style={{ opacity: 0 }}
        className="meta absolute left-0 top-0 whitespace-nowrap text-[11px] transition-opacity duration-200"
      >
        {viewer.label} · {arc.km.toLocaleString("en-US")} km
      </div>
    </div>
  );
}

function dotProduct(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
