import { CSSProperties } from "react";

/**
 * The night sky behind the globe.
 *
 * Positions come from a seeded PRNG rather than Math.random so the server and
 * client render the same sky — otherwise every star is a hydration mismatch.
 * Pure CSS animation, no JS per frame, so this costs nothing next to the globe.
 */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNT = 160;

const stars = (() => {
  const rand = mulberry32(0x51ee9);
  return Array.from({ length: COUNT }, (_, i) => {
    // Push stars away from the middle so they read as sky around the globe
    // rather than specks sitting on top of it.
    const angle = rand() * Math.PI * 2;
    const radius = 0.2 + Math.pow(rand(), 0.55) * 0.62;
    const size = rand() < 0.86 ? 1 + rand() * 1.1 : 2.1 + rand() * 1.3;
    const bright = 0.45 + rand() * 0.55;
    return {
      key: i,
      left: `${50 + Math.cos(angle) * radius * 62}%`,
      top: `${50 + Math.sin(angle) * radius * 74}%`,
      size,
      bright,
      dim: bright * (0.12 + rand() * 0.2),
      duration: 2.4 + rand() * 5.2,
      delay: rand() * 6,
    };
  });
})();

export function Stars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.key}
          className="absolute rounded-full bg-white"
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              "--bright": s.bright,
              "--dim": s.dim,
              animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow: s.size > 2 ? "0 0 4px rgba(255,255,255,0.55)" : undefined,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
