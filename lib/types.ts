/**
 * Shared data contract for dreamrr.
 * Every component in the app reads from these two shapes — nothing else.
 */

export type Person = {
  id: string;
  name: string;
  handle: string;
  /** Path under /public. May not exist yet — always render behind <Avatar/>'s fallback. */
  avatar: string;
  location: string;
  bio: string;
  dreamsSold: number;
  /** 0–5, one decimal place. */
  rating: number;
  /** Year joined, as a string. */
  joined: string;
};

export type Dream = {
  id: string;
  title: string;
  /** One or two sentences. Shown in the hover preview and the detail panel. */
  description: string;
  /** Poster frame, under /public. Shown first, always — it's what loads instantly. */
  image: string;
  /**
   * The dream itself, under /public. Fades in over the poster on hover.
   * Null for the few dreams that were only ever captured as a still.
   */
  video: string | null;
  /** Whole US dollars. */
  price: number;
  lat: number;
  lng: number;
  /** Human-readable place the dream was recorded. */
  location: string;
  /** ISO date, YYYY-MM-DD. */
  recordedAt: string;
  /** Length of the dream in minutes. */
  durationMin: number;
  /** Lowercase, single words where possible. Used by the AI for recommendations. */
  tags: string[];
  /** 1–10. */
  vividness: number;
  sellerId: Person["id"];
};

/** A dream joined to its seller. Most UI takes this rather than a bare Dream. */
export type DreamWithSeller = Dream & { seller: Person };
