"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formatPrice } from "@/lib/dreams";
import {
  earningsBeforeTonight,
  harvestedDreams,
  PLATFORM_FEE,
  sellerPayout,
  type HarvestedDream,
} from "@/lib/harvest";

/**
 * The selling side of dreamrr.
 *
 * Buying takes a dream out of the shelf and puts it in your head. This does the
 * reverse: it takes what is already in your head, prices it without asking, and
 * puts it on the shelf. Same theatre, opposite direction.
 *
 * The flow is one line: pitch → upload → scan → review each dream → payout.
 * Everything after the scan is a decision the user makes one dream at a time,
 * which is the whole joke — the price is not one of the things they decide.
 */
type Phase = "closed" | "pitch" | "upload" | "scanning" | "review" | "payout";

/** accepted → listed and paying. declined → kept, and worth nothing. */
type Decision = "accepted" | "declined";

type SellStore = {
  phase: Phase;
  open: () => void;
  close: () => void;

  /** Decision per harvested dream id. Absent means "not reviewed yet". */
  decisions: Record<string, Decision>;
  /** Dreams the user has agreed to sell, in catalogue order. */
  accepted: HarvestedDream[];
  /** Gross sales this month: what the month already held, plus tonight's yes-es. */
  earnings: number;
  /** True once the payout screen has been reached at least once. */
  hasSold: boolean;
};

const Ctx = createContext<SellStore | null>(null);

export function SellProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [hasSold, setHasSold] = useState(false);

  const accepted = useMemo(
    () => harvestedDreams.filter((d) => decisions[d.id] === "accepted"),
    [decisions],
  );

  const earnings = useMemo(
    () =>
      earningsBeforeTonight +
      (hasSold ? accepted.reduce((sum, d) => sum + d.price, 0) : 0),
    [accepted, hasSold],
  );

  const value = useMemo<SellStore>(
    () => ({
      phase,
      open: () => setPhase("pitch"),
      close: () => setPhase("closed"),
      decisions,
      accepted,
      earnings,
      hasSold,
    }),
    [phase, decisions, accepted, earnings, hasSold],
  );

  // The overlay owns the rest of the machine; it lives here so the panel and the
  // button can read the same store without prop-drilling through the page.
  return (
    <Ctx.Provider value={value}>
      <SellInternals.Provider
        value={{ setPhase, setDecisions, setHasSold }}
      >
        {children}
      </SellInternals.Provider>
    </Ctx.Provider>
  );
}

/** Writers, kept out of the public store so nothing outside this file drives the flow. */
const SellInternals = createContext<{
  setPhase: (p: Phase) => void;
  setDecisions: (fn: (prev: Record<string, Decision>) => Record<string, Decision>) => void;
  setHasSold: (v: boolean) => void;
} | null>(null);

export function useSellStore(): SellStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSellStore must be used inside <SellProvider>");
  return ctx;
}

function useSellInternals() {
  const ctx = useContext(SellInternals);
  if (!ctx) throw new Error("sell internals used outside <SellProvider>");
  return ctx;
}

/* -------------------------------------------------------------------------- */

/** The way in. Sits under the dream count, top right of the globe. */
export function MonetizeButton() {
  const { open, phase } = useSellStore();
  if (phase !== "closed") return null;

  return (
    <button
      type="button"
      onClick={open}
      className="absolute right-6 top-14 z-10 rounded-full border border-line-strong bg-paper-raised px-4 py-2 text-xs text-ink transition hover:border-dream hover:text-dream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dream"
    >
      Monetize my dreams
    </button>
  );
}

/**
 * The earnings ledger. Not on the globe until you have actually listed
 * something — before that there is nothing to brag about, and the number would
 * only be in the way.
 */
export function EarningsPanel() {
  const { earnings, accepted, hasSold, phase } = useSellStore();
  // Hidden while the overlay owns the screen; it reappears with the new number.
  if (!hasSold || phase !== "closed") return null;

  return (
    // Top right, stacked under the button — the bottom right belongs to the
    // chat launcher and the left to the dream panel.
    <aside className="absolute right-6 top-[6.5rem] z-20 w-[248px] rounded-lg border border-line bg-paper-raised p-4 shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
      <p className="meta">Your dream earnings · July</p>
      <p className="mt-2 font-mono text-2xl tabular-nums text-dream">
        {formatPrice(earnings)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        {accepted.length} dream{accepted.length === 1 ? "" : "s"} listed tonight.
        You keep {formatPrice(sellerPayout(earnings))} after fees.
      </p>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */

export function SellOverlay() {
  const { phase } = useSellStore();
  if (phase === "closed") return null;
  return <Sequence />;
}

/** Status lines for the scan, keyed to the progress they appear at. */
const SCAN_STAGES: [number, string][] = [
  [0, "Requesting read access to your head…"],
  [10, "Access granted (you agreed in 2024) ✓"],
  [22, "Indexing last 30 nights…"],
  [38, "Separating dreams from memories…"],
  [52, "Discarding 214 dreams about parking…"],
  [66, "Appraising emotional density…"],
  [78, "Cross-referencing market comparables…"],
  [88, "Setting prices. You cannot change these…"],
  [96, "Packaging for review…"],
];

function Sequence() {
  const { phase, decisions, close } = useSellStore();
  const { setPhase, setDecisions, setHasSold } = useSellInternals();

  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Blur and shrink the page underneath, exactly as checkout does.
  useEffect(() => {
    document.documentElement.dataset.sell = "on";
    return () => {
      delete document.documentElement.dataset.sell;
    };
  }, []);

  useEffect(() => {
    const all = timers.current;
    return () => {
      all.forEach(clearTimeout);
      all.length = 0;
    };
  }, []);

  // The scan. Uneven ticks so it reads as work rather than as a bar.
  useEffect(() => {
    if (phase !== "scanning") return;
    let value = 0;
    const tick = setInterval(() => {
      value += value > 86 ? 0.8 : value > 55 ? 2 : 3.4;
      if (value >= 100) {
        value = 100;
        clearInterval(tick);
        timers.current.push(setTimeout(() => setPhase("review"), 650));
      }
      setProgress(value);
    }, 90);
    return () => clearInterval(tick);
  }, [phase, setPhase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const decide = useCallback(
    (dream: HarvestedDream, decision: Decision) => {
      setDecisions((prev) => ({ ...prev, [dream.id]: decision }));
      setCursor((i) => i + 1);
    },
    [setDecisions],
  );

  const status =
    [...SCAN_STAGES].reverse().find(([at]) => progress >= at)?.[1] ??
    SCAN_STAGES[0][1];

  const reviewed = harvestedDreams.filter((d) => decisions[d.id]).length;
  const acceptedNow = harvestedDreams.filter(
    (d) => decisions[d.id] === "accepted",
  );
  const grossNow = acceptedNow.reduce((sum, d) => sum + d.price, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-paper/95 py-10 backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(var(--color-line-strong)_1px,transparent_1px),linear-gradient(90deg,var(--color-line-strong)_1px,transparent_1px)] [background-size:44px_44px] animate-[grid-drift_9s_linear_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-dream/20 blur-[100px] animate-[bloom_4s_ease-in-out_infinite]"
      />

      <div className="relative my-auto w-[min(680px,92vw)] px-6">
        {phase === "pitch" && (
          <div className="animate-[rise_0.5s_ease-out] text-center">
            <p className="meta text-dream">You have been dreaming for free</p>
            <h2 className="mt-4 text-[clamp(1.7rem,5vw,2.6rem)] font-medium leading-tight">
              Monetize my dreams
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
              Every night you produce between two and six original works and then
              throw all of them away. Other people are buying dreams on this exact
              globe. Some of them could be yours.
            </p>
            <button
              type="button"
              onClick={() => setPhase("upload")}
              className="mt-8 h-11 rounded-full bg-dream px-8 text-sm font-medium text-white transition hover:bg-dream-deep active:scale-[0.99]"
            >
              Start selling
            </button>
          </div>
        )}

        {phase === "upload" && (
          <div className="animate-[rise_0.5s_ease-out] rounded-lg border border-line bg-paper-raised p-8 text-center">
            <p className="meta text-dream">Step one of one</p>
            <h2 className="mt-3 text-2xl font-medium leading-snug">
              Upload your dreams to dreamrr
            </h2>
            <p className="mx-auto mt-3 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
              We read the last thirty nights straight off your cortex. It takes a
              moment and it does not hurt, in the sense that you will not remember
              whether it did.
            </p>

            <div className="mx-auto mt-7 flex max-w-[300px] flex-col items-center gap-1 rounded-lg border border-dashed border-line-strong bg-paper-sunk px-6 py-7">
              <p className="font-mono text-sm text-ink">30 nights detected</p>
              <p className="meta">≈ 41.6 GB of sleep</p>
            </div>

            <button
              type="button"
              onClick={() => setPhase("scanning")}
              className="mt-7 h-11 w-full max-w-[300px] rounded-full bg-dream text-sm font-medium text-white transition hover:bg-dream-deep active:scale-[0.99]"
            >
              Upload my dreams
            </button>
            <p className="meta mt-3">Nothing leaves your head. It copies.</p>
          </div>
        )}

        {phase === "scanning" && (
          <div className="animate-[rise_0.5s_ease-out] text-center">
            <p className="meta text-dream">Do not wake up</p>
            <h2 className="mt-4 text-[clamp(1.6rem,4.5vw,2.4rem)] font-medium leading-tight">
              Reading your dreams
            </h2>

            <div className="mt-8 h-[3px] w-full overflow-hidden rounded-full bg-paper-sunk">
              <div
                className="h-full rounded-full bg-dream shadow-[0_0_16px_var(--color-dream)] transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.04em]">
              <span className="text-ink-soft">{status}</span>
              <span className="text-ink tabular-nums">
                {Math.floor(progress)}%
              </span>
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="animate-[rise_0.5s_ease-out]">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="meta text-dream">
                  {harvestedDreams.length} dreams recovered
                </p>
                <h2 className="mt-2 text-2xl font-medium leading-snug">
                  Review your offers
                </h2>
              </div>
              <p className="meta shrink-0 text-right">
                {reviewed}/{harvestedDreams.length} reviewed
                <br />
                <span className="text-dream">{formatPrice(grossNow)} listed</span>
              </p>
            </div>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
              We have priced each one against the market. Prices are final. Accept
              and it goes on the globe tonight; decline and you keep it, which pays
              nothing.
            </p>

            <ul className="mt-6 flex flex-col gap-2">
              {harvestedDreams.map((dream, i) => (
                <OfferRow
                  key={dream.id}
                  dream={dream}
                  decision={decisions[dream.id]}
                  active={i === cursor}
                  onDecide={(d) => decide(dream, d)}
                />
              ))}
            </ul>

            <div className="sticky bottom-0 mt-6 flex items-center gap-3 bg-paper/95 py-4">
              <button
                type="button"
                onClick={() => {
                  setHasSold(true);
                  setPhase("payout");
                }}
                disabled={acceptedNow.length === 0}
                className="h-11 flex-1 rounded-full bg-dream text-sm font-medium text-white transition hover:bg-dream-deep active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-dream"
              >
                {acceptedNow.length === 0
                  ? "Accept at least one dream"
                  : `List ${acceptedNow.length} dream${acceptedNow.length === 1 ? "" : "s"} · ${formatPrice(grossNow)}`}
              </button>
              <button
                type="button"
                onClick={close}
                className="h-11 rounded-full border border-line px-5 text-sm text-ink-soft transition hover:border-line-strong hover:text-ink"
              >
                Later
              </button>
            </div>
          </div>
        )}

        {phase === "payout" && <Payout onDone={close} />}
      </div>

      {phase !== "review" && phase !== "payout" && (
        <button
          type="button"
          onClick={close}
          className="meta fixed bottom-6 left-1/2 -translate-x-1/2 transition-colors hover:text-ink-soft"
        >
          Esc to wake up
        </button>
      )}
    </div>
  );
}

/** One offer. Undecided rows carry the buttons; decided rows carry the verdict. */
function OfferRow({
  dream,
  decision,
  active,
  onDecide,
}: {
  dream: HarvestedDream;
  decision: Decision | undefined;
  active: boolean;
  onDecide: (d: Decision) => void;
}) {
  return (
    <li
      className={`rounded-lg border p-4 transition-colors ${
        decision === "accepted"
          ? "border-dream/40 bg-dream/[0.06]"
          : decision === "declined"
            ? "border-line bg-transparent opacity-45"
            : active
              ? "border-line-strong bg-paper-raised"
              : "border-line bg-paper-raised"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{dream.title}</p>
          <p className="meta mt-1">
            {dream.recordedAt} · {dream.durationMin} min · vividness{" "}
            {dream.vividness}/10
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg tabular-nums text-dream">
            {formatPrice(dream.price)}
          </p>
          <p className="meta">our price</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        {dream.description}
      </p>
      <p className="meta mt-2">{dream.priceNote}</p>

      {decision ? (
        <p
          className={`meta mt-3 ${decision === "accepted" ? "text-dream" : ""}`}
        >
          {decision === "accepted"
            ? "Listed · goes live tonight"
            : "Declined · kept, worth nothing"}
        </p>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onDecide("accepted")}
            className="h-9 flex-1 rounded-full bg-dream text-xs font-medium text-white transition hover:bg-dream-deep active:scale-[0.99]"
          >
            Accept {formatPrice(dream.price)}
          </button>
          <button
            type="button"
            onClick={() => onDecide("declined")}
            className="h-9 rounded-full border border-line px-5 text-xs text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            Decline
          </button>
        </div>
      )}
    </li>
  );
}

function Payout({ onDone }: { onDone: () => void }) {
  const { accepted, earnings } = useSellStore();
  const gross = accepted.reduce((sum, d) => sum + d.price, 0);

  return (
    <div className="animate-[pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)] text-center">
      <p className="meta text-dream">You are a seller now</p>
      <h2 className="mt-4 text-[clamp(1.6rem,4.5vw,2.4rem)] font-medium leading-tight">
        {accepted.length} dream{accepted.length === 1 ? "" : "s"} on the globe
      </h2>
      <p className="mx-auto mt-3 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
        Strangers are already turning the planet toward you.
      </p>

      <div className="mx-auto mt-8 max-w-[380px] rounded-lg border border-line bg-paper-raised text-left">
        <Line label="Listed tonight" value={formatPrice(gross)} />
        <Line
          label={`Platform fee (${Math.round(PLATFORM_FEE * 100)}%)`}
          value={`− ${formatPrice(gross - sellerPayout(gross))}`}
        />
        <Line label="Earlier this month" value={formatPrice(earnings - gross)} />
        <div className="flex items-baseline justify-between border-t border-line p-4">
          <span className="meta text-ink-soft">Your July</span>
          <span className="font-mono text-xl tabular-nums text-dream">
            {formatPrice(sellerPayout(earnings))}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-7 h-11 rounded-full border border-line-strong px-7 text-sm text-ink transition hover:border-dream hover:text-dream"
      >
        Back to the globe
      </button>
      <p className="meta mt-3">Paid out the first night you sleep past 9am.</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line p-4">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className="font-mono text-sm tabular-nums text-ink">{value}</span>
    </div>
  );
}
