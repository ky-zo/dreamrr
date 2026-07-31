/**
 * Projects a lat/lng onto the globe canvas, in exactly the way cobe does.
 *
 * We don't use cobe's own markers. cobe draws to WebGL, so its markers can't be
 * hovered, focused, or given a tooltip. Instead we run cobe's projection here in
 * JS and place real DOM elements over the canvas. The dot you see and the dot
 * you can hover are then the same element and can never drift apart.
 *
 * The maths below is transcribed from cobe 2.0.1's own `U()` (lat/lng to unit
 * sphere) and `O()` (sphere to normalised device coords) — see
 * node_modules/cobe/dist/index.esm.js. Keep them in sync if cobe is upgraded.
 */

/** cobe draws the sphere at radius 0.8 of the canvas half-width. */
export const GLOBE_RADIUS = 0.8;

export type Projected = {
  /** CSS pixels from the left edge of the canvas. */
  x: number;
  /** CSS pixels from the top edge of the canvas. */
  y: number;
  /** True on the hemisphere facing the viewer. */
  visible: boolean;
  /**
   * 1 dead centre, 0 at the silhouette. Fade dots out with this so they slide
   * away round the edge instead of vanishing.
   */
  facing: number;
};

/** cobe's `U`: [lat, lng] in degrees to a point on the unit sphere. */
function latLngToUnitSphere(lat: number, lng: number): [number, number, number] {
  const latR = (lat * Math.PI) / 180;
  const lngR = (lng * Math.PI) / 180 - Math.PI;
  const c = Math.cos(latR);
  return [-c * Math.cos(lngR), Math.sin(latR), c * Math.sin(lngR)];
}

/**
 * @param size   Canvas edge length in CSS pixels. The globe is always square here.
 * @param phi    cobe's current `state.phi`, radians.
 * @param theta  cobe's current `state.theta`, radians.
 */
export function projectLatLng(
  lat: number,
  lng: number,
  size: number,
  phi: number,
  theta: number,
): Projected {
  const [ux, uy, uz] = latLngToUnitSphere(lat, lng);
  const px = ux * GLOBE_RADIUS;
  const py = uy * GLOBE_RADIUS;
  const pz = uz * GLOBE_RADIUS;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  // cobe's `O`, with a square canvas (aspect 1), scale 1 and no offset.
  const ndcX = cosPhi * px + sinPhi * pz;
  const ndcY = sinPhi * sinTheta * px + cosTheta * py - cosPhi * sinTheta * pz;
  const depth = -sinPhi * cosTheta * px + sinTheta * py + cosPhi * cosTheta * pz;

  return {
    x: ((ndcX + 1) / 2) * size,
    y: ((-ndcY + 1) / 2) * size,
    visible: depth >= 0,
    // depth maxes out at GLOBE_RADIUS, so normalise back to 0..1.
    facing: Math.max(0, depth / GLOBE_RADIUS),
  };
}

/**
 * The `phi` and `theta` that bring a point to the dead centre of the near face.
 * Used to spin the globe to a dream when one is picked from the chat or a card.
 *
 * Both are solved from the projection above and verified to land at ndc (0, 0)
 * with positive depth. Note there is a second solution half a turn away that
 * also lands at (0, 0) — but on the far side, where you'd see nothing.
 */
export function phiForLongitude(lng: number): number {
  return -Math.PI / 2 - (lng * Math.PI) / 180;
}

export function thetaForLatitude(lat: number): number {
  return (lat * Math.PI) / 180;
}

/** Shortest signed angular distance from `from` to `to`, in radians. */
export function shortestAngleDelta(from: number, to: number): number {
  const tau = Math.PI * 2;
  return ((((to - from) % tau) + tau + Math.PI) % tau) - Math.PI;
}
