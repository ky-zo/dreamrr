"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { SPIN_HOVERED, SPIN_IDLE, type GlobeRotation } from "./rotation";

type Props = {
  rotation: RefObject<GlobeRotation>;
  size: number;
  hovered: boolean;
};

const DRAG_SENSITIVITY = 0.006;

export function GlobeCanvas({ rotation, size, hovered }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredRef = useRef(hovered);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let width = rotation.current.size;
    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width,
      height: width,
      phi: rotation.current.phi,
      theta: rotation.current.theta,
      // cobe's shader mixes between (1-q) and q for the map term on `dark`.
      // dark:1 is the un-inverted branch — land dots come out BRIGHTER than the
      // ocean, which is what a night sky wants. (dark:0 was the paper look.)
      dark: 1,
      diffuse: 0,
      mapSamples: 16000,
      // mapBaseBrightness is a floor on the map texture, so anything above 0
      // dots the oceans too. Land only.
      mapBrightness: 1,
      mapBaseBrightness: 0,
      // Ocean lands on baseColor*0.1 (near black), land on baseColor*1.1.
      baseColor: [0.62, 0.65, 0.78],
      markerColor: [1, 0.29, 0.18],
      glowColor: [0.16, 0.18, 0.3],
      opacity: 1,
      markers: [],
    });

    let speed = SPIN_IDLE;
    let faded = false;
    let raf = requestAnimationFrame(function frame() {
      raf = requestAnimationFrame(frame);
      const r = rotation.current;
      speed += ((hoveredRef.current ? SPIN_HOVERED : SPIN_IDLE) - speed) * 0.08;
      r.phi += speed;

      // cobe 2.0.1 has no render loop of its own — every frame is an update() call.
      // `diffuse` is resent because cobe reads it as `diffuse || 1` at creation, so
      // the 0 we want only takes effect through update().
      const next: Partial<COBEOptions> = { phi: r.phi, theta: r.theta, diffuse: 0 };
      if (r.size !== width && r.size > 0) {
        width = r.size;
        next.width = width;
        next.height = width;
      }
      globe.update(next);

      if (!faded) {
        faded = true;
        canvas.style.opacity = "1";
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      // cobe re-parents the canvas into a wrapper div it never cleans up. Put the
      // canvas back where React left it so unmounting doesn't hit a missing child.
      const wrapper = canvas.parentElement;
      if (wrapper && wrapper !== host) {
        host.append(canvas);
        wrapper.remove();
      }
    };
  }, [rotation]);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const from = dragRef.current;
    if (!from) return;
    const r = rotation.current;
    r.phi += (e.clientX - from.x) * DRAG_SENSITIVITY;
    r.theta = Math.max(
      -0.9,
      Math.min(0.9, r.theta + (e.clientY - from.y) * DRAG_SENSITIVITY),
    );
    dragRef.current = { x: e.clientX, y: e.clientY };
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div ref={hostRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, opacity: 0 }}
        className={`block touch-none transition-opacity duration-700 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
}
