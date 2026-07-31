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
};

const Ctx = createContext<DreamStore | null>(null);

export function DreamStoreProvider({ children }: { children: ReactNode }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const globeFocus = useRef<((dream: DreamWithSeller) => void) | null>(null);

  const byId = useMemo(
    () => new Map(dreamsWithSellers.map((d) => [d.id, d])),
    [],
  );

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) {
        const dream = byId.get(id);
        if (dream) globeFocus.current?.(dream);
      }
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
      selectedId,
      select,
      ownedIds,
      isOwned: (id) => ownedIds.includes(id),
      purchase,
      checkoutId,
      startCheckout,
      endCheckout,
      registerGlobeFocus,
    }),
    [
      hoveredId,
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
