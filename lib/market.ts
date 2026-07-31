/**
 * What the market is doing this week.
 *
 * The catalogue tells you what exists; this tells you what it's worth and
 * where it's going. Hand-authored on purpose — the tags in dreams.json are too
 * granular to be a market ("eggs", "taxi"), and the joke lives in the copy, not
 * in a groupBy.
 */

export type MarketSegment = {
  id: string;
  /** What buyers call it. */
  label: string;
  /** Week-over-week movement, percent. Negative is a crash. */
  change: number;
  /** What a dream in this segment typically clears, in whole dollars. */
  avgPrice: number;
  /** Share of everything sold on dreamrr this week, percent. */
  share: number;
  /** The analyst line. Deadpan, faintly ghoulish. */
  note: string;
};

export const marketSegments: MarketSegment[] = [
  {
    id: "grief",
    label: "Grief & the returned",
    change: 41,
    avgPrice: 1180,
    share: 9,
    note: "Thin supply, desperate demand. The only segment where buyers name their own price.",
  },
  {
    id: "surreal-work",
    label: "Workplace surrealism",
    change: 14,
    avgPrice: 240,
    share: 17,
    note: "Up for the fifth straight quarter. Something is happening in offices.",
  },
  {
    id: "landscape",
    label: "Impossible geography",
    change: 9,
    avgPrice: 860,
    share: 12,
    note: "Two moons still outsell one. Nobody at dreamrr knows why.",
  },
  {
    id: "nostalgia",
    label: "Childhood interiors",
    change: 6,
    avgPrice: 390,
    share: 14,
    note: "Reliable. Buyers aged 28–41 return to this shelf weekly.",
  },
  {
    id: "chase",
    label: "Pursuit & flight",
    change: -3,
    avgPrice: 95,
    share: 19,
    note: "High volume, low margin. The commodity of the dream economy.",
  },
  {
    id: "anxiety",
    label: "Teeth, exams, falling",
    change: -22,
    avgPrice: 7,
    share: 29,
    note: "Catastrophically oversupplied. Everyone is selling, nobody is buying.",
  },
];

/** Total dreams traded on the platform this week. Goes up. Always goes up. */
export const dreamsTradedThisWeek = 412_889;

/** Average clearing price across everything, in whole dollars. */
export const marketAvgPrice = 164;

/** Week-over-week movement of the market as a whole, percent. */
export const marketChange = 8;
