"use client";

import { useChatContext } from "@copilotkit/react-ui";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { dreams } from "@/lib/dreams";

/**
 * The landing beat: the globe starts small and idle, everything else is out of
 * the way, and one button hands the page over to the user.
 *
 * State lives in a context rather than in <GlobeStage> because the globe, the
 * header and the panel all react to it, and the globe itself must stay mounted
 * across the transition — remounting it would restart cobe and lose the spin.
 */
type Intro = {
  /** False until the user presses enter. Drives every intro transition. */
  entered: boolean;
  enter: () => void;
};

const IntroContext = createContext<Intro | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const enter = useCallback(() => setEntered(true), []);
  return <IntroContext.Provider value={{ entered, enter }}>{children}</IntroContext.Provider>;
}

export function useIntro() {
  const ctx = useContext(IntroContext);
  if (!ctx) throw new Error("useIntro must be used inside <IntroProvider>");
  return ctx;
}

/** Fades its children in once the intro is done, and keeps them unclickable until then. */
export function AfterIntro({ children }: { children: ReactNode }) {
  const { entered } = useIntro();
  return (
    <div
      className={`transition-opacity duration-700 ease-out ${
        entered ? "opacity-100 delay-300" : "pointer-events-none opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export function IntroOverlay() {
  const { entered, enter } = useIntro();
  // The overlay renders inside <CopilotSidebar>, so it can open the chat
  // directly. One press does both: the page arrives and the chat arrives with it.
  const { setOpen } = useChatContext();

  return (
    <div
      aria-hidden={entered}
      className={`pointer-events-none absolute inset-0 z-40 transition-opacity duration-500 ease-out ${
        entered ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Offset from the middle by a little more than the shrunken globe's
          radius, so the copy sits under it at every viewport size. */}
      <div className="absolute left-1/2 top-[calc(50%+11rem)] flex -translate-x-1/2 flex-col items-center gap-5 text-center">
        <p
          className={`meta transition-all duration-700 ease-out ${
            entered ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {dreams.length} dreams · one small planet
        </p>
        <button
          type="button"
          onClick={() => {
            enter();
            setOpen(true);
          }}
          disabled={entered}
          className={`pointer-events-auto rounded-full border border-line-strong bg-paper-raised px-7 py-3 text-sm text-ink transition duration-300 ease-out hover:border-dream hover:text-dream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dream ${
            entered ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          Enter the world of dreamrr
        </button>
      </div>
    </div>
  );
}
