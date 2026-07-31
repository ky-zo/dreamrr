"use client";

import { useState } from "react";
import { useDreamStore } from "@/components/dream-store";
import { formatPrice } from "@/lib/dreams";
import type { DreamWithSeller } from "@/lib/types";

export function BuyButton({
  dream,
  className = "",
}: {
  dream: DreamWithSeller;
  className?: string;
}) {
  const { isOwned, purchase } = useDreamStore();
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const owned = isOwned(dream.id);

  async function buy() {
    setState("working");
    try {
      await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamId: dream.id }),
      });
    } catch {
      // The mock purchase completes either way — never leave the user stuck.
    }
    await new Promise((r) => setTimeout(r, 900));
    purchase(dream.id);
    setState("done");
  }

  if (owned || state === "done") {
    return (
      <div className={className}>
        <div className="flex h-11 w-full items-center justify-center rounded-full border border-line bg-paper-sunk text-sm text-ink-soft">
          Owned — yours to dream
        </div>
      </div>
    );
  }

  const working = state === "working";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={buy}
        disabled={working}
        className="h-11 w-full rounded-full bg-[#635bff] text-sm font-medium text-white transition hover:bg-[#5851e8] active:scale-[0.99] disabled:opacity-60 disabled:hover:bg-[#635bff]"
      >
        {working ? "Processing…" : `Buy this dream · ${formatPrice(dream.price)}`}
      </button>
      <p className="meta mt-2 text-center">Powered by Stripe</p>
    </div>
  );
}
