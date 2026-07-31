"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/media";
import { averageRating, getReviews, ratingHistogram } from "@/lib/reviews";
import type { DreamWithSeller } from "@/lib/types";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[11px] leading-none tracking-[0.15em] text-ink">
      {"★★★★★".slice(0, Math.round(value))}
      <span className="text-ink-soft/40">{"★★★★★".slice(Math.round(value))}</span>
    </span>
  );
}

export function DreamReviews({ dream }: { dream: DreamWithSeller }) {
  const [open, setOpen] = useState(false);
  const reviews = useMemo(() => getReviews(dream), [dream]);
  const avg = averageRating(reviews);
  const bins = ratingHistogram(reviews);

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-paper-sunk/40"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm text-ink">{avg.toFixed(1)}</span>
          <Stars value={avg} />
          <span className="meta">{reviews.length} reviews</span>
        </span>
        <span className={`text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="mb-4 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = bins[star - 1];
              const pct = reviews.length ? (n / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-3 font-mono text-[10px] text-ink-soft">{star}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-paper-sunk">
                    <span
                      className="block h-full rounded-full bg-ink-soft/60"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-4 text-right font-mono text-[10px] text-ink-soft">{n}</span>
                </div>
              );
            })}
          </div>

          <ul className="space-y-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="flex gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0"
              >
                <Avatar
                  src={r.avatar}
                  alt={r.author}
                  className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-paper-sunk object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium">{r.author}</p>
                    <p className="meta shrink-0">{r.when}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="meta">{r.handle}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">{r.body}</p>
                  {r.helpful > 0 && (
                    <p className="meta mt-2">{r.helpful} found this helpful</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
