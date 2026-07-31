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

export type Vec3 = [number, number, number];

/** cobe's `U`: [lat, lng] in degrees to a point on the unit sphere. */
export function latLngToUnitSphere(lat: number, lng: number): Vec3 {
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
  return projectVector(latLngToUnitSphere(lat, lng), GLOBE_RADIUS, size, phi, theta);
}

/**
 * The same projection for a point that isn't on the surface — pass a radius
 * above GLOBE_RADIUS to place it out in front of the sphere. That's how the
 * flight arc bows up off the globe instead of lying flat on it.
 */
export function projectVector(
  [ux, uy, uz]: Vec3,
  radius: number,
  size: number,
  phi: number,
  theta: number,
): Projected {
  const px = ux * radius;
  const py = uy * radius;
  const pz = uz * radius;

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
    // Behind the viewer's side of the sphere only counts as hidden if the
    // sphere is actually in the way. A point lifted off the surface can sit
    // behind the equator and still be seen, out past the silhouette — which is
    // exactly where a high arc spends its time.
    visible:
      depth >= 0 || Math.hypot(ndcX, ndcY) >= GLOBE_RADIUS,
    // depth maxes out at the radius, so normalise back to 0..1.
    facing: Math.max(0, Math.min(1, depth / radius)),
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

/**
 * The shortest path over the surface between two lat/lngs, as unit vectors.
 *
 * Straight-line interpolation would cut through the planet; this walks the
 * great circle by rotating one vector toward the other (slerp), so the line
 * follows the curve of the globe the way a flight path does.
 */
export function greatCircle(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  steps: number,
): Vec3[] {
  const a = latLngToUnitSphere(from.lat, from.lng);
  const b = latLngToUnitSphere(to.lat, to.lng);
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  const points: Vec3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Antipodal or coincident points have no unique arc — fall back to a lerp,
    // which is exact at t=0 and t=1 and never divides by ~0.
    const [wa, wb] =
      sinOmega < 1e-6
        ? [1 - t, t]
        : [Math.sin((1 - t) * omega) / sinOmega, Math.sin(t * omega) / sinOmega];
    points.push([
      a[0] * wa + b[0] * wb,
      a[1] * wa + b[1] * wb,
      a[2] * wa + b[2] * wb,
    ]);
  }
  return points;
}

/** Great-circle distance in kilometres, for the label on the arc. */
export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** Shortest signed angular distance from `from` to `to`, in radians. */
export function shortestAngleDelta(from: number, to: number): number {
  const tau = Math.PI * 2;
  return ((((to - from) % tau) + tau + Math.PI) % tau) - Math.PI;
}
