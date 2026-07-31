import { reviewerAvatar } from "./avatars";
import type { Dream } from "./types";

export type Review = {
  id: string;
  author: string;
  handle: string;
  /** Memoji-style face under /public, derived from the handle. */
  avatar: string;
  /** 1–5 whole stars. */
  rating: number;
  /** Human-readable, relative. */
  when: string;
  body: string;
  helpful: number;
};

type Seed = { author: string; handle: string; rating: number; body: string };

/**
 * Review copy pool. Deliberately uneven — long ones, short ones, angry ones,
 * jokes — so any dream's slice reads like a real listing's reviews.
 */
const POOL: Seed[] = [
  {
    author: "Dan Okafor",
    handle: "@nightbus",
    rating: 5,
    body: "Bought this on a Tuesday with zero expectations and I have not shut up about it since. The detail holds all the way to the edges — no smearing, no grey where the dreamer stopped paying attention. You can feel that they were actually *in* it. Worth every dollar and then some. Already sent the link to four people.",
  },
  {
    author: "Priya Raman",
    handle: "@softstatic",
    rating: 4,
    body: "Great dream, slightly oversold. It's vivid, sure, but the last two minutes get thin and you can tell where they woke up. Still one of the better ones I own.",
  },
  {
    author: "Marcus Held",
    handle: "@vitrine",
    rating: 1,
    body: "Paid full price. Woke up in MY OWN BEDROOM. Refund pending for eleven days now. Support keeps telling me dreams are non-returnable once played, which — yes, obviously, that's the entire problem.",
  },
  {
    author: "Yuki Tanabe",
    handle: "@kettleboil",
    rating: 5,
    body: "Fell asleep in it three nights running. My cat now avoids the chair.",
  },
  {
    author: "Elena Vasquez",
    handle: "@dosorillas",
    rating: 5,
    body: "I don't normally review things. I've had a hard year and this one gave me something I hadn't had in a while, which is a night that felt like it belonged to somebody who was happy. Thank you to whoever dreamt this and decided to sell it instead of keeping it.",
  },
  {
    author: "Tobias Lind",
    handle: "@grainstore",
    rating: 3,
    body: "Fine. It's fine. It's a dream. It happened, I was there, I left. Three stars for existing.",
  },
  {
    author: "Hannah Weiss",
    handle: "@postcardrack",
    rating: 2,
    body: "Audio is completely blown out in the middle section. Everyone's talking at once and none of it resolves into words. If that's intentional it should say so in the listing.",
  },
  {
    author: "Ade Balogun",
    handle: "@lagoswake",
    rating: 5,
    body: "Ten out of ten. Would be dreamt again. My partner tried it and now we argue about what colour the sky was, which I think is the highest compliment a dream can get.",
  },
  {
    author: "Clara Fontaine",
    handle: "@marchhare",
    rating: 4,
    body: "Beautiful texture, honest listing, fast delivery. Docking one star only because I've now had it stuck in my head for six days and I have a job.",
  },
  {
    author: "Renzo Barreto",
    handle: "@doceochenta",
    rating: 5,
    body: "This is my third purchase from this seller and the quality is consistent in a way that almost nobody on here manages. No filler, no long stretches of hallway. They cut before it gets boring.",
  },
  {
    author: "Nadia Fahmy",
    handle: "@almanacq",
    rating: 1,
    body: "Do not buy this if you have to be anywhere the next morning. I'm serious. I lost a whole day.",
  },
  {
    author: "Peter Nowak",
    handle: "@zimnywiatr",
    rating: 4,
    body: "Solid. Held up on a second playthrough, which most don't.",
  },
  {
    author: "Simone Ottaviani",
    handle: "@tramfourteen",
    rating: 5,
    body: "My therapist asked where this came from and I said I bought it for the price of a nice dinner and she wrote something down.",
  },
  {
    author: "Grace Lim",
    handle: "@paperlantern",
    rating: 3,
    body: "Good but shorter than I expected. The listing duration includes the fade, which feels like padding. Seller was polite about it when I asked.",
  },
  {
    author: "Owen Fitzgerald",
    handle: "@quaywall",
    rating: 5,
    body: "Absolutely unhinged and I mean that with love.",
  },
  {
    author: "Ingrid Sørensen",
    handle: "@fjordglass",
    rating: 4,
    body: "I've bought a lot of these and most are somebody's anxiety with the lights turned down. This one has an actual shape to it — a beginning, a turn, an ending you feel coming. That's rare. Small colour banding in the wide shots, otherwise excellent.",
  },
  {
    author: "Malik Rahimi",
    handle: "@bluecarton",
    rating: 2,
    body: "Not what was described. Tags said one thing, dream did another. I'm not saying it's bad, I'm saying I bought a sandwich and got soup.",
  },
  {
    author: "Josie Trent",
    handle: "@rollerdisco",
    rating: 5,
    body: "SCREAMING. Ten stars. My roommate heard me laughing at 4am and thought something was wrong.",
  },
  {
    author: "Ravi Chandrasekhar",
    handle: "@meterbox",
    rating: 4,
    body: "Technically clean, emotionally heavy. Go in rested.",
  },
  {
    author: "Beatrix Halloran",
    handle: "@wrenandco",
    rating: 5,
    body: "I bought this for my sister's birthday because she's impossible to shop for and she called me crying, in a good way. That's the review.",
  },
  {
    author: "Kwame Mensah",
    handle: "@harmattan",
    rating: 3,
    body: "Middling. The first half earns the price, the second half coasts on it.",
  },
  {
    author: "Lucia Moretti",
    handle: "@viadelforno",
    rating: 5,
    body: "Perfect. No notes. Well — one note. Whoever is selling these should charge more, and I say that against my own interest.",
  },
  {
    author: "Sam Okonjo-Reid",
    handle: "@twelvebar",
    rating: 1,
    body: "Woke up angry and I still can't explain why. Zero stars if the form allowed it. Seller responded within the hour and was genuinely kind about it, which is the only reason this isn't a longer review.",
  },
  {
    author: "Anneke de Vries",
    handle: "@laagwater",
    rating: 4,
    body: "Careful with this one on a work night. Otherwise, gorgeous.",
  },
  {
    author: "Tomás Iriarte",
    handle: "@surdelsur",
    rating: 5,
    body: "Been chasing a dream like this since I was a teenager and stopped believing anyone actually captured them properly. The seller's description undersells it. Buy it before they figure out what they have.",
  },
  {
    author: "Fiona Brackley",
    handle: "@northwold",
    rating: 2,
    body: "Kept glitching at the halfway mark on my rig. Might be me. Might be them. Support said 'dreams are like that' which, sure, but also no.",
  },
  {
    author: "Hiroshi Ueda",
    handle: "@fivestations",
    rating: 5,
    body: "Quiet, strange, stayed with me for a week. I keep thinking about one small thing in it that probably wasn't even the point.",
  },
  {
    author: "Delphine Amara",
    handle: "@rueverte",
    rating: 4,
    body: "Would recommend to a friend. Would not recommend to my mother.",
  },
  {
    author: "Gus Pemberton",
    handle: "@allotment9",
    rating: 5,
    body: "Bought it as a joke. Not a joke. Sat on the edge of the bed afterwards for twenty minutes.",
  },
  {
    author: "Zainab Idrissi",
    handle: "@saffronline",
    rating: 3,
    body: "Decent value at this price, would be overpriced at double. Seller is responsive and honest, which counts for a lot on this site.",
  },
];

/** Stable, tiny string hash — same dream always gets the same reviews. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const AGES = [
  "2 days ago",
  "a week ago",
  "2 weeks ago",
  "3 weeks ago",
  "a month ago",
  "2 months ago",
  "4 months ago",
  "6 months ago",
  "a year ago",
];

/**
 * Deterministic per-dream review slice. Vivid dreams skew toward more reviews;
 * ordering is shuffled per dream so no two listings read the same way.
 */
export function getReviews(dream: Pick<Dream, "id" | "vividness">): Review[] {
  const seed = hash(dream.id);
  const count = 4 + (seed % 5) + (dream.vividness >= 8 ? 2 : 0);
  const start = seed % POOL.length;
  const step = 7; // coprime with pool length — walks the whole pool without repeats

  const out: Review[] = [];
  for (let i = 0; i < count; i++) {
    const s = POOL[(start + i * step) % POOL.length];
    const n = hash(dream.id + s.handle);
    out.push({
      id: `${dream.id}-${s.handle}`,
      author: s.author,
      handle: s.handle,
      avatar: reviewerAvatar(s.handle),
      rating: s.rating,
      when: AGES[n % AGES.length],
      body: s.body,
      helpful: n % 37,
    });
  }
  return out;
}

export function averageRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/** Count of reviews at each star level, index 0 = 1★ … index 4 = 5★. */
export function ratingHistogram(reviews: Review[]): number[] {
  const bins = [0, 0, 0, 0, 0];
  for (const r of reviews) bins[r.rating - 1]++;
  return bins;
}
