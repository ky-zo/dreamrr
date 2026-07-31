"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { formatPrice } from "@/lib/dreams";
import {
  dreamsTradedThisWeek,
  marketAvgPrice,
  marketChange,
  marketSegments,
  type MarketSegment,
} from "@/lib/market";

/**
 * The market ticker.
 *
 * "What's selling right now" is a seller's question and a buyer's excuse, so it
 * gets the same treatment as the earnings dashboard: no prose, one panel. Bars
 * run out from a centre line so a crash reads as a crash — the anxiety segment
 * pointing left is the whole joke and it should be visible at a glance.
 */
export function CopilotMarket() {
  useCopilotReadable({
    description:
      "Live dreamrr market data — what is selling, what is crashing, and what it clears for. Show it with showMarketTrends, never in prose.",
    value: {
      dreamsTradedThisWeek,
      marketAvgPrice,
      marketChangePct: marketChange,
      segments: marketSegments,
    },
  });

  useCopilotAction({
    name: "showMarketTrends",
    description:
      "Show the live dreamrr market: which categories of dream are rising or crashing, what they clear for, and their share of trade. Call this for any question about what is selling, what is in demand, what a kind of dream is worth, whether now is a good time to sell, or how the market is doing.",
    parameters: [
      {
        name: "highlightSegmentId",
        type: "string",
        description:
          "Optional id of the one segment most relevant to what the user asked: grief, surreal-work, landscape, nostalgia, chase or anxiety",
        required: false,
      },
      {
        name: "note",
        type: "string",
        description: "One short lowercase sentence reading the market for them",
        required: false,
      },
    ],
    handler: async ({ highlightSegmentId }) => {
      const hit = marketSegments.find((s) => s.id === highlightSegmentId);
      return hit
        ? `Showed the market, highlighting ${hit.label} (${hit.change > 0 ? "+" : ""}${hit.change}%).`
        : "Showed the market trends panel.";
    },
    render: ({ args }) => (
      <MarketPanel highlight={args.highlightSegmentId} note={args.note} />
    ),
  });

  return null;
}

function MarketPanel({ highlight, note }: { highlight?: string; note?: string }) {
  // Bars are scaled against the biggest move in either direction so the crash
  // and the boom stay comparable.
  const peak = Math.max(...marketSegments.map((s) => Math.abs(s.change)));

  return (
    <div className="my-1 overflow-hidden rounded-lg border border-line bg-paper-raised">
      <div className="flex items-baseline justify-between border-b border-line px-3 py-2.5">
        <div>
          <p className="meta">dreamrr market · this week</p>
          <p className="mt-1 font-mono text-lg tabular-nums leading-none">
            {dreamsTradedThisWeek.toLocaleString("en-US")}{" "}
            <span className="text-xs text-ink-soft">dreams traded</span>
          </p>
        </div>
        <span className="font-mono text-xs tabular-nums text-dream">
          ▲ {marketChange}%
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {marketSegments.map((s) => (
          <Row key={s.id} seg={s} peak={peak} lit={s.id === highlight} />
        ))}
      </ul>

      <div className="border-t border-line px-3 py-2">
        <p className="meta">
          avg clearing price {formatPrice(marketAvgPrice)} · all segments
        </p>
      </div>

      {note ? (
        <p className="border-t border-line px-3 py-2 text-xs italic text-ink-soft">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function Row({
  seg,
  peak,
  lit,
}: {
  seg: MarketSegment;
  peak: number;
  lit: boolean;
}) {
  const up = seg.change >= 0;
  const width = `${(Math.abs(seg.change) / peak) * 50}%`;

  return (
    <li className={`px-3 py-2.5 ${lit ? "bg-dream/8" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`truncate text-xs ${lit ? "text-dream" : ""}`}>
          {seg.label}
        </span>
        <span
          className={`shrink-0 font-mono text-xs tabular-nums ${up ? "text-dream" : "text-ink-soft"}`}
        >
          {up ? "▲" : "▼"} {Math.abs(seg.change)}%
        </span>
      </div>

      {/* Centre line at 50%: gains grow right, losses grow left. */}
      <div className="relative mt-1.5 h-1.5 w-full rounded-sm bg-paper-sunk">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
        <div
          className={`absolute inset-y-0 rounded-sm transition-all duration-500 ${up ? "bg-dream" : "bg-ink-soft/50"}`}
          style={up ? { left: "50%", width } : { right: "50%", width }}
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <p className="truncate text-[11px] leading-tight text-ink-soft">{seg.note}</p>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-soft">
          {formatPrice(seg.avgPrice)} · {seg.share}%
        </span>
      </div>
    </li>
  );
}
