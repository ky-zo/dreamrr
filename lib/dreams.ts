import dreamsJson from "@/data/dreams.json";
import peopleJson from "@/data/people.json";
import type { Dream, DreamWithSeller, Person } from "./types";

export const people = peopleJson as Person[];
export const dreams = dreamsJson as Dream[];

const peopleById = new Map(people.map((p) => [p.id, p]));

/** Every dream, joined to its seller. Stable order — safe to use as a render key source. */
export const dreamsWithSellers: DreamWithSeller[] = dreams.map((d) => {
  const seller = peopleById.get(d.sellerId);
  if (!seller) throw new Error(`dreams.json: ${d.id} references unknown seller ${d.sellerId}`);
  return { ...d, seller };
});

const dreamsById = new Map(dreamsWithSellers.map((d) => [d.id, d]));

export function getDream(id: string): DreamWithSeller | undefined {
  return dreamsById.get(id);
}

export function getPerson(id: string): Person | undefined {
  return peopleById.get(id);
}

export const allTags: string[] = [...new Set(dreams.flatMap((d) => d.tags))].sort();

export function formatPrice(usd: number): string {
  return `$${usd.toLocaleString("en-US")}`;
}
