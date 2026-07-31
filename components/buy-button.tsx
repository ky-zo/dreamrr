"use client";

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
  const { isOwned, startCheckout } = useDreamStore();
  const owned = isOwned(dream.id);

  if (owned) {
    return (
      <div className={className}>
        <div className="flex h-11 w-full items-center justify-center rounded-full border border-line bg-paper-sunk text-sm text-ink-soft">
          Owned — yours to dream
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => startCheckout(dream.id)}
        className="h-11 w-full rounded-full bg-[#635bff] text-sm font-medium text-white transition hover:bg-[#5851e8] active:scale-[0.99]"
      >
        {`Buy this dream · ${formatPrice(dream.price)}`}
      </button>
      <p className="meta mt-2 text-center">Powered by Stripe</p>
    </div>
  );
}
