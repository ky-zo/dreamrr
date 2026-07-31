/**
 * The other side of the marketplace: the dreams *you* are sitting on.
 *
 * Nothing here is real. The catalogue in dreams.json is what other people sell;
 * this is what "Monetize my dreams" pulls out of your head, with prices the
 * system decides for you and does not negotiate.
 */

export type HarvestedDream = {
  id: string;
  title: string;
  /** How the extractor describes what it found. Deadpan, slightly invasive. */
  description: string;
  /** ISO date, YYYY-MM-DD — the night it happened. */
  recordedAt: string;
  durationMin: number;
  /** 1–10, same scale as the catalogue. */
  vividness: number;
  tags: string[];
  /** Whole US dollars. Set by us, not by you. */
  price: number;
  /** The one-line reason the price is what it is. This is where the money talks. */
  priceNote: string;
};

/** Every dream the scan finds, in the order it finds them. */
export const harvestedDreams: HarvestedDream[] = [
  {
    id: "h-01",
    title: "Teeth, again",
    description:
      "Six molars, one hand, no dentist. You have had this dream forty-one times. The market has seen it forty-one million.",
    recordedAt: "2026-07-28",
    durationMin: 4,
    vividness: 6,
    tags: ["anxiety", "teeth", "common"],
    price: 3,
    priceNote: "Heavily saturated category. Priced to move.",
  },
  {
    id: "h-02",
    title: "The house with the extra room",
    description:
      "Your childhood home, one door further down the hall than it has ever had. Warm. Dusty. Nobody home.",
    recordedAt: "2026-07-24",
    durationMin: 19,
    vividness: 9,
    tags: ["nostalgia", "architecture", "warm"],
    price: 420,
    priceNote: "Strong demand from buyers aged 28–41. Rare interior.",
  },
  {
    id: "h-03",
    title: "Falling, but politely",
    description:
      "Eleven seconds of descent, no impact. You apologised on the way down. Twice.",
    recordedAt: "2026-07-22",
    durationMin: 1,
    vividness: 5,
    tags: ["falling", "short", "polite"],
    price: 12,
    priceNote: "Under two minutes. Sold as a clip, not a feature.",
  },
  {
    id: "h-04",
    title: "Swimming through the office",
    description:
      "The floor was water and nobody mentioned it. You made it to the meeting. You were still late.",
    recordedAt: "2026-07-19",
    durationMin: 12,
    vividness: 8,
    tags: ["surreal", "work", "water"],
    price: 180,
    priceNote: "Workplace surrealism is up 14% this quarter.",
  },
  {
    id: "h-05",
    title: "A conversation with someone who is gone",
    description:
      "Kitchen table. They were fine. They asked about you and you did not think to ask anything back.",
    recordedAt: "2026-07-16",
    durationMin: 23,
    vividness: 10,
    tags: ["grief", "tender", "vivid"],
    price: 1250,
    priceNote: "Top 1% emotional density. Buyers pay for this one.",
  },
  {
    id: "h-06",
    title: "The exam you did not study for",
    description:
      "A subject you have never taken, in a building you have never entered, with a pen that does not work.",
    recordedAt: "2026-07-11",
    durationMin: 8,
    vividness: 7,
    tags: ["anxiety", "school", "common"],
    price: 6,
    priceNote: "Everyone has this one. Volume play.",
  },
  {
    id: "h-07",
    title: "Red beach, two moons",
    description:
      "Forty minutes of a coastline that does not exist, rendered at a fidelity your brain should not be capable of.",
    recordedAt: "2026-07-06",
    durationMin: 41,
    vividness: 10,
    tags: ["landscape", "alien", "long"],
    price: 2100,
    priceNote: "Unrepeatable geography. Flagged for the featured shelf.",
  },
  {
    id: "h-08",
    title: "You, but confident",
    description:
      "You said the thing at the right time and the room went quiet in the good way. Duration: nine seconds.",
    recordedAt: "2026-07-02",
    durationMin: 1,
    vividness: 4,
    tags: ["wish", "short", "self"],
    price: 1,
    priceNote: "Buyers report it does not survive waking. Priced accordingly.",
  },
];

/** What the ledger already said before tonight's scan. The month has been good to you. */
export const earningsBeforeTonight = 1840;

/** Cut we take. Shown once, in small type, exactly like every marketplace does it. */
export const PLATFORM_FEE = 0.3;

export function sellerPayout(gross: number): number {
  return Math.round(gross * (1 - PLATFORM_FEE));
}
