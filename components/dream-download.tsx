"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDreamStore } from "@/components/dream-store";
import { formatPrice } from "@/lib/dreams";
import type { DreamWithSeller } from "@/lib/types";

/**
 * What happens after "Buy this dream".
 *
 * The page implodes (see `[data-checkout]` in globals.css), the screen is handed
 * over to a fake neural download, it lands, and then — because this is a
 * marketplace — we try to sell one more thing.
 *
 * Phases run on timers rather than real work: the purchase is a mock, so the
 * theatre *is* the feature. Every phase can be skipped with Escape.
 */
type Phase =
  | "warp"
  | "downloading"
  | "success"
  | "upsell"
  | "splicing"
  | "installed";

/** Status lines, keyed to the progress they appear at. */
const STAGES: [number, string][] = [
  [0, "Establishing uplink to cortex…"],
  [12, "Handshake with brainstem ✓"],
  [26, "Locating occipital lobe…"],
  [40, "Decrypting REM payload…"],
  [55, "Streaming 4.2 GB of feeling…"],
  [70, "Rendering faces you have never seen…"],
  [82, "Negotiating with your subconscious…"],
  [91, "Suppressing alarm clock…"],
  [97, "Sealing the dream…"],
];

/** Dollars, like every other price in the catalogue. */
const CRUSH_PRICE = 20;
const LUCID_PRICE = 35;

/** One upgrade you can toggle on. Selection is the whole interaction. */
function AddOnCard({
  selected,
  onSelect,
  title,
  price,
  blurb,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: number;
  blurb: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`cursor-pointer rounded-lg border p-4 text-left transition ${
        selected
          ? "border-dream bg-dream/5"
          : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug">{title}</h3>
        <span
          aria-hidden
          className={`mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
            selected
              ? "border-dream bg-dream text-white"
              : "border-line-strong text-transparent"
          }`}
        >
          ✓
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{blurb}</p>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-faint">
        + {formatPrice(price)}
      </p>
      {children}
    </div>
  );
}

export function DreamDownload() {
  const { dreams, checkoutId } = useDreamStore();
  const dream = dreams.find((d) => d.id === checkoutId) ?? null;
  if (!dream) return null;
  // Keyed so every purchase starts the sequence from scratch — no state to reset.
  return <Sequence key={dream.id} dream={dream} />;
}

function Sequence({ dream }: { dream: DreamWithSeller }) {
  const { endCheckout, purchase } = useDreamStore();

  const [phase, setPhase] = useState<Phase>("warp");
  const [progress, setProgress] = useState(0);
  const [crush, setCrush] = useState("");
  const [wantsCrush, setWantsCrush] = useState(false);
  const [wantsLucid, setWantsLucid] = useState(false);
  const [addOns, setAddOns] = useState<{ crush: boolean; lucid: boolean }>({
    crush: false,
    lucid: false,
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const close = useCallback(() => {
    endCheckout();
  }, [endCheckout]);

  // Blur and shrink the page underneath for as long as we own the screen.
  useEffect(() => {
    document.documentElement.dataset.checkout = "on";
    return () => {
      delete document.documentElement.dataset.checkout;
    };
  }, []);

  // The sequence.
  useEffect(() => {
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dreamId: dream.id }),
      // The mock purchase completes either way — never leave the user stuck.
    }).catch(() => {});

    after(900, () => setPhase("downloading"));

    // Uneven ticks: a download that climbs at a constant rate reads as a bar,
    // not as something happening.
    let value = 0;
    const tick = setInterval(() => {
      value += value > 88 ? 0.7 : value > 60 ? 1.8 : 3.2;
      if (value >= 100) {
        value = 100;
        clearInterval(tick);
        setTimeout(() => setPhase("success"), 500);
        setTimeout(() => setPhase("upsell"), 2600);
      }
      setProgress(value);
    }, 90);

    const all = timers.current;
    return () => {
      clearInterval(tick);
      all.forEach(clearTimeout);
      all.length = 0;
    };
  }, [dream, after]);

  // The dream is yours the moment the download lands.
  useEffect(() => {
    if (phase === "success") purchase(dream.id);
  }, [dream, phase, purchase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const status =
    [...STAGES].reverse().find(([at]) => progress >= at)?.[1] ?? STAGES[0][1];

  // Only a named crush counts — an empty box buys nothing.
  const crushReady = wantsCrush && crush.trim().length > 0;
  const extra = (crushReady ? CRUSH_PRICE : 0) + (wantsLucid ? LUCID_PRICE : 0);

  function addOnsConfirm() {
    setAddOns({ crush: crushReady, lucid: wantsLucid });
    setPhase("splicing");
    after(2200, () => setPhase("installed"));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-paper/95 backdrop-blur-xl">
      {/* Background: a slow neural grid plus one breathing bloom of dream red. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(var(--color-line-strong)_1px,transparent_1px),linear-gradient(90deg,var(--color-line-strong)_1px,transparent_1px)] [background-size:44px_44px] animate-[grid-drift_9s_linear_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-dream/20 blur-[100px] animate-[bloom_4s_ease-in-out_infinite]"
      />

      <div className="relative w-[min(560px,90vw)] px-6 text-center">
        {phase === "warp" && (
          <p className="meta animate-[flicker_0.35s_steps(2)_infinite] text-dream">
            Opening a channel…
          </p>
        )}

        {phase === "downloading" && (
          <div className="animate-[rise_0.5s_ease-out]">
            <p className="meta text-dream">Do not wake up</p>
            <h2 className="mt-4 text-[clamp(1.6rem,4.5vw,2.4rem)] font-medium leading-tight">
              Downloading dream to your brain
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{dream.title}</p>

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

        {phase === "success" && (
          <div className="animate-[pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-dream/60 text-4xl text-dream">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border border-dream animate-[ping-ring_1.4s_ease-out_infinite]"
              />
              ✓
            </div>
            <h2 className="mt-6 text-[clamp(1.6rem,4.5vw,2.4rem)] font-medium">
              Dream installed
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {dream.title} is yours. It plays tonight, whether you like it or not.
            </p>
          </div>
        )}

        {phase === "upsell" && (
          <div className="animate-[rise_0.5s_ease-out] rounded-lg border border-line bg-paper-raised p-7 text-left">
            <p className="meta text-dream">One more thing</p>
            <h2 className="mt-3 text-2xl font-medium leading-snug">
              Upgrade tonight
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Two things we can splice in while the dream is still warm.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AddOnCard
                selected={wantsCrush}
                onSelect={() => setWantsCrush((v) => !v)}
                title="Add your crush"
                price={CRUSH_PRICE}
                blurb="One person of your choosing, spliced into every scene. They will be nice to you. No eye contact in the morning."
              >
                {wantsCrush && (
                  <input
                    autoFocus
                    value={crush}
                    onChange={(e) => setCrush(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    // Space and Enter belong to the name, not to the card.
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Their name…"
                    className="mt-3 h-10 w-full rounded-full border border-line bg-paper-sunk px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-dream"
                  />
                )}
              </AddOnCard>

              <AddOnCard
                selected={wantsLucid}
                onSelect={() => setWantsLucid((v) => !v)}
                title="Add lucid dreaming"
                price={LUCID_PRICE}
                blurb="You will know it is a dream. You get the controls. Flying included; consequences still not."
              />
            </div>

            <button
              type="button"
              onClick={addOnsConfirm}
              disabled={extra === 0}
              className="mt-5 h-11 w-full rounded-full bg-dream text-sm font-medium text-white transition hover:bg-dream-deep active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-dream"
            >
              {extra === 0
                ? "Pick an upgrade"
                : `Splice it in · extra ${formatPrice(extra)}`}
            </button>
            <button
              type="button"
              onClick={close}
              className="mt-2 h-9 w-full text-xs text-ink-faint transition hover:text-ink-soft"
            >
              No thanks, I&apos;m boring
            </button>
          </div>
        )}

        {phase === "splicing" && (
          <div className="animate-[rise_0.4s_ease-out]">
            <p className="meta text-dream animate-[flicker_0.5s_steps(2)_infinite]">
              Splicing
            </p>
            <h2 className="mt-4 text-[clamp(1.4rem,4vw,2rem)] font-medium leading-tight">
              {addOns.crush
                ? `Adding ${crush.trim()} to your dream`
                : "Handing you the controls"}
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              {addOns.crush
                ? "Rendering their face from memory. Softening their opinions."
                : "Teaching you to notice the doorways."}
              {addOns.crush && addOns.lucid
                ? " Installing lucidity, so you will remember all of it."
                : null}
            </p>
            <div className="mx-auto mt-8 h-[3px] w-56 overflow-hidden rounded-full bg-paper-sunk">
              <div className="h-full w-1/3 rounded-full bg-dream shadow-[0_0_16px_var(--color-dream)] animate-[sweep_1.1s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {phase === "installed" && (
          <div className="animate-[pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
            <h2 className="text-[clamp(1.6rem,4.5vw,2.4rem)] font-medium">
              {addOns.crush ? `${crush.trim()} is in.` : "You are awake in there."}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Charged {formatPrice(dream.price + extra)}. Go to sleep.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-7 h-11 rounded-full border border-line-strong px-7 text-sm text-ink transition hover:border-dream hover:text-dream"
            >
              Back to the globe
            </button>
          </div>
        )}
      </div>

      {/* Always available, never loud. */}
      {phase !== "upsell" && phase !== "installed" && (
        <button
          type="button"
          onClick={close}
          className="meta absolute bottom-6 left-1/2 -translate-x-1/2 transition-colors hover:text-ink-soft"
        >
          Esc to wake up
        </button>
      )}
    </div>
  );
}
