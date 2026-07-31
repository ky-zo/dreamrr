"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { dreamsWithSellers } from "@/lib/dreams";
import type { DreamWithSeller } from "@/lib/types";
import {
  locationFromTimeZone,
  requestPreciseLocation,
  type ViewerLocation,
} from "@/lib/viewer-location";

/**
 * The whole app's state. It is small on purpose: which dot is hovered, which
 * dream is open, which ones have been bought, and a way for anything on the
 * page to ask the globe to turn to a dream.
 */
type DreamStore = {
  dreams: DreamWithSeller[];

  /** Dot currently under the pointer (or keyboard focus). Drives the popover. */
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;

  /**
   * Dream the assistant is currently pointing at. Marked on the globe and
   * turned to, but the detail panel stays shut — this is a "look here", not an
   * "open this". Swiping the recommendation carousel drives it.
   */
  highlightedId: string | null;
  /** Marks a dream on the globe and rotates to it. Null clears the mark. */
  highlight: (id: string | null) => void;

  /** Dream open in the detail panel. Null means the panel is closed. */
  selectedId: string | null;
  /** Opens the panel and turns the globe to that dream. Pass null to close. */
  select: (id: string | null) => void;

  ownedIds: string[];
  isOwned: (id: string) => boolean;
  /** Mock purchase. Marks the dream owned; the dot goes from red to spent. */
  purchase: (id: string) => void;

  /**
   * Dream currently being "downloaded to your brain". Non-null hands the whole
   * screen over to <DreamDownload>; the page itself blurs out behind it.
   */
  checkoutId: string | null;
  startCheckout: (id: string) => void;
  endCheckout: () => void;

  /**
   * The globe calls this once on mount to hand over a way to rotate itself.
   * Anything else (chat cards, the panel) just calls `select`.
   */
  registerGlobeFocus: (fn: (dream: DreamWithSeller) => void) => void;

  /**
   * Where you are. Guessed from your time zone on mount, upgraded to real
   * coordinates the first time you open a dream (which is when we ask). Null
   * only if we know neither. Drives the line from you to the dream.
   */
  viewer: ViewerLocation | null;
};

const Ctx = createContext<DreamStore | null>(null);

export function DreamStoreProvider({ children }: { children: ReactNode }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const globeFocus = useRef<((dream: DreamWithSeller) => void) | null>(null);

  const byId = useMemo(
    () => new Map(dreamsWithSellers.map((d) => [d.id, d])),
    [],
  );

  // Seeded from the time zone: no permission prompt just for landing here, and
  // no server/client mismatch — nothing renders the viewer until a dream is
  // open, which can't be true on the first paint.
  const [viewer, setViewer] = useState<ViewerLocation | null>(() =>
    typeof window === "undefined" ? null : locationFromTimeZone(),
  );
  const askedForLocation = useRef(false);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) {
        const dream = byId.get(id);
        if (dream) globeFocus.current?.(dream);
        // First dream opened is the first moment the line is worth a prompt.
        if (!askedForLocation.current) {
          askedForLocation.current = true;
          requestPreciseLocation().then((precise) => {
            if (precise) setViewer(precise);
          });
        }
      }
    },
    [byId],
  );

  const highlight = useCallback(
    (id: string | null) => {
      setHighlightedId(id);
      if (!id) return;
      const dream = byId.get(id);
      if (dream) globeFocus.current?.(dream);
    },
    [byId],
  );

  const registerGlobeFocus = useCallback(
    (fn: (dream: DreamWithSeller) => void) => {
      globeFocus.current = fn;
    },
    [],
  );

  const purchase = useCallback((id: string) => {
    setOwnedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const startCheckout = useCallback((id: string) => setCheckoutId(id), []);
  const endCheckout = useCallback(() => setCheckoutId(null), []);

  const value = useMemo<DreamStore>(
    () => ({
      dreams: dreamsWithSellers,
      hoveredId,
      setHoveredId,
      highlightedId,
      highlight,
      selectedId,
      select,
      ownedIds,
      isOwned: (id) => ownedIds.includes(id),
      purchase,
      checkoutId,
      startCheckout,
      endCheckout,
      registerGlobeFocus,
      viewer,
    }),
    [
      viewer,
      hoveredId,
      highlightedId,
      highlight,
      selectedId,
      ownedIds,
      select,
      purchase,
      checkoutId,
      startCheckout,
      endCheckout,
      registerGlobeFocus,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDreamStore(): DreamStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDreamStore must be used inside <DreamStoreProvider>");
  return ctx;
}
