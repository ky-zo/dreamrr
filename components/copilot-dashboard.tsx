"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { formatPrice } from "@/lib/dreams";
import { useSellStore } from "@/components/sell-flow";
import {
  harvestedDreams,
  PLATFORM_FEE,
  sellerPayout,
  earningsBeforeTonight,
} from "@/lib/harvest";

/**
 * The money side of the assistant.
 *
 * "How much did I make this month?" is the one question a marketplace should
 * never answer in prose, so it doesn't: the action renders a small ledger in
 * the chat — total, payout, the months behind it, and which dreams did the
 * earning. Numbers come from the sell store, so it always agrees with the
 * earnings panel on the page.
 */

/** Months already banked. July is live and comes from the store. */
const HISTORY: [string, number][] = [
  ["Feb", 210],
  ["Mar", 480],
  ["Apr", 390],
  ["May", 1120],
  ["Jun", 1460],
];

export function CopilotDashboard() {
  const { earnings, accepted, hasSold } = useSellStore();

  useCopilotReadable({
    description:
      "The user's own dreamrr seller earnings. Use showEarningsDashboard to display these, never prose.",
    value: {
      month: "July 2026",
      grossThisMonth: earnings,
      payoutAfterFees: sellerPayout(earnings),
      platformFeePct: PLATFORM_FEE * 100,
      earnedBeforeTonight: earningsBeforeTonight,
      dreamsListedTonight: accepted.length,
      dreamsScanned: harvestedDreams.length,
      previousMonths: Object.fromEntries(HISTORY),
    },
  });

  useCopilotAction({
    name: "showEarningsDashboard",
    description:
      "Show the user their own seller dashboard: money earned this month, payout after fees, month-over-month trend and which of their dreams earned it. Call this for ANY question about their earnings, revenue, payouts, sales or how their dreams are performing.",
    parameters: [
      {
        name: "note",
        type: "string",
        description: "One short lowercase sentence of commentary on the numbers",
        required: false,
      },
    ],
    handler: async () =>
      `Showed the dashboard: ${formatPrice(earnings)} gross in July, ${formatPrice(sellerPayout(earnings))} after fees.`,
    render: ({ args }) => (
      <Dashboard
        note={args.note}
        earnings={earnings}
        listed={hasSold ? accepted.length : 0}
        top={
          hasSold && accepted.length > 0
            ? [...accepted].sort((a, b) => b.price - a.price).slice(0, 3)
            : []
        }
      />
    ),
  });

  return null;
}

function Dashboard({
  note,
  earnings,
  listed,
  top,
}: {
  note?: string;
  earnings: number;
  listed: number;
  top: { id: string; title: string; price: number; durationMin: number }[];
}) {
  const months: [string, number][] = [...HISTORY, ["Jul", earnings]];
  const peak = Math.max(...months.map(([, v]) => v), 1);
  const prev = HISTORY[HISTORY.length - 1][1];
  const delta = prev > 0 ? Math.round(((earnings - prev) / prev) * 100) : 0;
  const minutes = top.reduce((s, d) => s + d.durationMin, 0);

  return (
    <div className="my-1 overflow-hidden rounded-lg border border-line bg-paper-raised">
      <div className="border-b border-line px-3 py-2.5">
        <p className="meta">Seller dashboard · July 2026</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl tabular-nums leading-none text-dream">
            {formatPrice(earnings)}
          </span>
          <span
            className={`font-mono text-xs tabular-nums ${delta >= 0 ? "text-dream" : "text-ink-soft"}`}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          gross · you keep{" "}
          <span className="font-mono tabular-nums">
            {formatPrice(sellerPayout(earnings))}
          </span>{" "}
          after the {Math.round(PLATFORM_FEE * 100)}% fee
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
        <Stat label="listed" value={String(listed)} />
        <Stat label="scanned" value={String(harvestedDreams.length)} />
        <Stat label="dream min" value={String(minutes)} />
      </div>

      <div className="px-3 py-3">
        <p className="meta mb-2">Last 6 months</p>
        <div className="flex h-20 items-end gap-1.5">
          {months.map(([label, value], i) => {
            const live = i === months.length - 1;
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-sm transition-all duration-500 ${live ? "bg-dream" : "bg-ink-soft/25"}`}
                  style={{ height: `${Math.max((value / peak) * 64, 3)}px` }}
                  title={formatPrice(value)}
                />
                <span
                  className={`text-[10px] leading-none ${live ? "text-dream" : "text-ink-soft"}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {top.length > 0 ? (
        <div className="border-t border-line px-3 py-3">
          <p className="meta mb-2">Top earners</p>
          <ul className="flex flex-col gap-1.5">
            {top.map((d) => (
              <li key={d.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate text-xs">{d.title}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-dream">
                  {formatPrice(d.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="border-t border-line px-3 py-3">
          <p className="text-xs text-ink-soft">
            all of it from dreams sold before tonight. run a scan and the number moves.
          </p>
        </div>
      )}

      {note ? (
        <p className="border-t border-line px-3 py-2 text-xs italic text-ink-soft">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2">
      <div className="font-mono text-base tabular-nums leading-none">{value}</div>
      <div className="meta mt-1">{label}</div>
    </div>
  );
}
