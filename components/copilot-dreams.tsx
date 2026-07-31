"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { DreamDeck } from "@/components/dream-deck";
import { dreamsWithSellers, getDream } from "@/lib/dreams";
import type { DreamWithSeller } from "@/lib/types";

const catalogue = dreamsWithSellers.map((d) => ({
  id: d.id,
  title: d.title,
  description: d.description,
  tags: d.tags,
  price: d.price,
  location: d.location,
  durationMin: d.durationMin,
  vividness: d.vividness,
  seller: d.seller.name,
}));

export function CopilotDreams() {
  useCopilotReadable({
    description: "Every dream currently for sale on dreamrr",
    value: catalogue,
  });

  useCopilotAction({
    name: "recommendDreams",
    description:
      "Show the user 1 to 4 dreams from the catalogue that match what they asked for. Several are shown as a deck they swipe through, and whichever dream is in front lights up on the globe. Always use this instead of describing dreams in prose.",
    parameters: [
      {
        name: "dreamIds",
        type: "string[]",
        description: "Between one and four dream ids from the catalogue, best match first",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "One short sentence on why these fit",
        required: false,
      },
    ],
    // The cards are the whole point of this action, so the handler does nothing
    // but confirm what was shown. CopilotKit rejects an action that has a render
    // and no handler, and without this the model narrates the dreams in prose
    // instead of letting the cards do it.
    handler: async ({ dreamIds }) => {
      const shown = (dreamIds ?? [])
        .map((id) => getDream(id))
        .filter((d): d is DreamWithSeller => Boolean(d))
        .slice(0, 4);
      if (shown.length === 0) return "No matching dream — ask the user to describe it differently.";
      return `Showed the user: ${shown.map((d) => d.title).join(", ")}.`;
    },
    render: ({ status, args }) => {
      const dreams = (args.dreamIds ?? [])
        .map((id) => getDream(id))
        .filter((d): d is DreamWithSeller => Boolean(d))
        .slice(0, 4);

      if (dreams.length === 0) {
        return status === "complete" ? <></> : <CardSkeleton />;
      }

      return (
        <div className="flex flex-col gap-2 py-1">
          {args.reason ? (
            <p className="text-xs italic text-ink-soft">{args.reason}</p>
          ) : null}
          {/* Keyed by the set of dreams so a fresh recommendation starts at
              card one instead of inheriting the last deck's position. */}
          <DreamDeck key={dreams.map((d) => d.id).join("-")} dreams={dreams} />
        </div>
      );
    },
  });

  return null;
}

function CardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-md border border-line bg-paper-raised p-2">
      <div className="aspect-[16/9] w-full rounded-sm bg-paper-sunk" />
      <div className="mt-2 h-3 w-2/3 rounded-sm bg-paper-sunk" />
      <div className="mt-2 h-3 w-1/3 rounded-sm bg-paper-sunk" />
    </div>
  );
}
