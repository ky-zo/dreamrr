"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";
import { DreamMedia, PlayBadge } from "@/components/media";
import { useDreamStore } from "@/components/dream-store";
import { dreamsWithSellers, formatPrice, getDream } from "@/lib/dreams";
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
      "Show the user 1 or 2 dreams from the catalogue that match what they asked for. Always use this instead of describing dreams in prose.",
    parameters: [
      {
        name: "dreamIds",
        type: "string[]",
        description: "One or two dream ids from the catalogue, best match first",
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
        .slice(0, 2);
      if (shown.length === 0) return "No matching dream — ask the user to describe it differently.";
      return `Showed the user: ${shown.map((d) => d.title).join(", ")}.`;
    },
    render: ({ status, args }) => {
      const dreams = (args.dreamIds ?? [])
        .map((id) => getDream(id))
        .filter((d): d is DreamWithSeller => Boolean(d))
        .slice(0, 2);

      if (dreams.length === 0) {
        return status === "complete" ? <></> : <CardSkeleton />;
      }

      return (
        <div className="flex flex-col gap-3 py-1">
          {args.reason ? (
            <p className="text-xs italic text-ink-soft">{args.reason}</p>
          ) : null}
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))}
        </div>
      );
    },
  });

  return null;
}

function DreamCard({ dream }: { dream: DreamWithSeller }) {
  const { select } = useDreamStore();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => select(dream.id)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      aria-label={`Open ${dream.title}, recorded in ${dream.location}, ${formatPrice(dream.price)}`}
      className="block w-full rounded-md border border-line bg-paper-raised p-2 text-left transition-colors hover:border-line-strong"
    >
      <div className="relative">
        <DreamMedia
          poster={dream.image}
          video={dream.video}
          alt={dream.title}
          active={hovered}
          className="aspect-[16/9] w-full overflow-hidden rounded-sm"
        />
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5">
          {dream.video ? <PlayBadge /> : null}
          <span className="meta rounded-sm bg-paper-raised/85 px-1.5 py-0.5">
            {dream.durationMin} min
          </span>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-sm font-medium leading-snug">{dream.title}</div>
        <div className="meta mt-1">{dream.location}</div>
        <p className="mt-1.5 line-clamp-2 text-xs text-ink-soft">{dream.description}</p>
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
          <span className="font-mono text-sm">{formatPrice(dream.price)}</span>
          <span className="meta">{dream.seller.name}</span>
        </div>
      </div>
    </button>
  );
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
