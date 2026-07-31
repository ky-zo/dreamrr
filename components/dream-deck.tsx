"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DreamMedia, PlayBadge } from "@/components/media";
import { useDreamStore } from "@/components/dream-store";
import { formatPrice } from "@/lib/dreams";
import type { DreamWithSeller } from "@/lib/types";

/**
 * The recommendation deck.
 *
 * One dream is a card. Several are a deck you swipe, because a chat column is
 * the wrong shape for a list and scrolling past a dream isn't the same as
 * choosing between them.
 *
 * Whichever card is in front is *the* dream: the globe turns to it and marks
 * the dot. Swiping is therefore a way of steering the globe from the chat,
 * which is the trick worth showing.
 */
export function DreamDeck({ dreams }: { dreams: DreamWithSeller[] }) {
  const { highlight, highlightedId, select } = useDreamStore();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  /** True once a pointer-down has travelled far enough to be a swipe, not a tap. */
  const moved = useRef(false);
  const frame = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);

  const count = dreams.length;
  const current = dreams[Math.min(index, count - 1)];

  // The front card owns the globe *and* the detail panel. Also runs on mount,
  // so a recommendation lights up its dot and opens on the left the moment it
  // appears — a dream the assistant picked is treated exactly like one you
  // clicked yourself, and swiping the deck moves both.
  useEffect(() => {
    if (!current) return;
    highlight(current.id);
    select(current.id);
  }, [current, highlight, select]);

  // Let go of the globe when the deck scrolls out of the conversation.
  useEffect(
    () => () => {
      highlight(null);
    },
    [highlight],
  );

  if (count === 0) return null;

  const go = (next: number) => setIndex(Math.max(0, Math.min(count - 1, next)));

  const width = () => frame.current?.offsetWidth ?? 1;

  const onDown = (e: React.PointerEvent) => {
    if (count < 2) return;
    start.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    if (Math.abs(dx) > 6) moved.current = true;
    // Rubber-band at the two ends so the deck feels finite.
    const past = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
    setDrag(past ? dx * 0.28 : dx);
  };

  const onUp = () => {
    if (start.current === null) return;
    // A quarter of the card is enough of a commitment.
    if (Math.abs(drag) > width() * 0.25) go(index + (drag < 0 ? 1 : -1));
    start.current = null;
    setDragging(false);
    setDrag(0);
  };

  const offset = -index * 100;

  return (
    <div className="flex flex-col gap-2 py-1">
      <div
        ref={frame}
        className="relative overflow-hidden rounded-md"
        style={{ touchAction: count > 1 ? "pan-y" : undefined }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        // A swipe that ends on a card must not also open it.
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
      >
        <div
          className="flex"
          style={{
            transform: `translate3d(calc(${offset}% + ${drag}px), 0, 0)`,
            transition: dragging ? "none" : "transform 320ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {dreams.map((dream, i) => (
            <div key={dream.id} className="w-full shrink-0">
              <DreamCard
                dream={dream}
                // Only the front card is reachable; the rest are scenery until
                // they're swiped to, so a click mid-drag can't open the wrong one.
                inert={i !== index}
                marked={highlightedId === dream.id}
              />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            {index > 0 ? (
              <Arrow dir="left" onClick={() => go(index - 1)} />
            ) : null}
            {index < count - 1 ? (
              <Arrow dir="right" onClick={() => go(index + 1)} />
            ) : null}
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex items-center justify-between px-0.5">
          <span className="meta">swipe · on the globe now</span>
          <div className="flex items-center gap-1.5">
            {dreams.map((dream, i) => (
              <button
                key={dream.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${dream.title}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-dream" : "w-1.5 bg-ink-soft/40 hover:bg-ink-soft"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A card that plays on hover looks like a still until you happen to touch it,
 * so the first one with footage says so. It's spent the moment anyone hovers a
 * card — this is a nudge, not a label — and it's session-scoped, like
 * everything else in this app.
 */
let hintSpent = false;
const hintWatchers = new Set<() => void>();

function useHoverHint(): [boolean, () => void] {
  const showing = useSyncExternalStore(
    (notify) => {
      hintWatchers.add(notify);
      return () => hintWatchers.delete(notify);
    },
    () => !hintSpent,
    // Never on the server: it can only be wrong by the time it hydrates.
    () => false,
  );

  const spend = useCallback(() => {
    if (hintSpent) return;
    hintSpent = true;
    for (const notify of hintWatchers) notify();
  }, []);

  return [showing, spend];
}

function Arrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Previous dream" : "Next dream"}
      className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-line-strong bg-paper-raised/90 px-2 py-1.5 text-xs leading-none text-ink backdrop-blur-sm transition hover:border-dream hover:text-dream ${
        dir === "left" ? "left-1.5" : "right-1.5"
      }`}
    >
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}

function DreamCard({
  dream,
  inert,
  marked,
}: {
  dream: DreamWithSeller;
  inert: boolean;
  marked: boolean;
}) {
  const { select } = useDreamStore();
  const [hovered, setHovered] = useState(false);
  const [hintShowing, spendHint] = useHoverHint();
  // Front card only, and only where there's something to play.
  const hint = hintShowing && !inert && !!dream.video;

  return (
    <button
      type="button"
      onClick={() => !inert && select(dream.id)}
      tabIndex={inert ? -1 : 0}
      aria-hidden={inert}
      onPointerEnter={() => {
        spendHint();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      aria-label={`Open ${dream.title}, recorded in ${dream.location}, ${formatPrice(dream.price)}`}
      className={`block w-full select-none rounded-md border bg-paper-raised p-2 text-left transition-[border-color,opacity] ${
        marked ? "border-dream/60" : "border-line hover:border-line-strong"
      } ${inert ? "opacity-45" : ""}`}
    >
      <div className="relative">
        <DreamMedia
          poster={dream.image}
          video={dream.video}
          alt={dream.title}
          active={hovered && !inert}
          className="pointer-events-none aspect-[16/9] w-full overflow-hidden rounded-sm"
        />
        {/* Pointer devices only — there is no hover to ask for on a touchscreen. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 hidden items-center justify-center transition-opacity duration-300 [@media(hover:hover)]:flex ${
            hint ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="meta rounded-full bg-paper-raised/90 px-2.5 py-1 backdrop-blur-sm">
            hover to play
          </span>
        </span>

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
