/**
 * The live rotation of the globe, shared by mutation rather than React state.
 *
 * <GlobeCanvas> writes to this object on every cobe frame; <DreamDots> reads it
 * on its own animation frame and moves the dots. Neither re-renders to do it —
 * at 60fps through React state this would re-render the tree 60 times a second
 * for 24 dots.
 */
export type GlobeRotation = {
  /** Yaw, radians. Increases as the globe spins. */
  phi: number;
  /** Tilt, radians. Positive brings the north pole toward the viewer. */
  theta: number;
  /** Canvas edge length in CSS pixels. 0 until the first layout pass. */
  size: number;
};

export function createRotation(): GlobeRotation {
  return { phi: 0, theta: 0.22, size: 0 };
}

/** Radians per frame at rest, and while the pointer is over the globe. */
export const SPIN_IDLE = 0.0032;
export const SPIN_HOVERED = 0.0004;
