/**
 * Memoji-style avatar art, vendored under /public/avatars.
 *
 * Source: github.com/alohe/avatars ("memo" set), MIT. Apple-*style* originals —
 * not Apple's own Memoji assets, which are not licensed for redistribution.
 *
 * 35 faces, split so the two populations never fight over the same file:
 * sellers own 1–9 (assigned by hand in data/people.json, one each), reviewers
 * hash into 10–35.
 */

export const AVATAR_COUNT = 35;

/** Files 10–35 — the reviewer half of the pool. */
const REVIEWER_START = 10;
const REVIEWER_COUNT = AVATAR_COUNT - REVIEWER_START + 1;

export function avatarPath(n: number): string {
  return `/avatars/memo_${n}.png`;
}

/** Stable, tiny string hash. Same handle always lands on the same face. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic reviewer avatar — keyed on the handle, which is unique per author. */
export function reviewerAvatar(handle: string): string {
  return avatarPath(REVIEWER_START + (hash(handle) % REVIEWER_COUNT));
}
