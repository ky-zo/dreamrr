"use client";

import { useChatContext } from "@copilotkit/react-ui";

/**
 * Not a bar — just the count and the chat button, floated over the top-right of
 * the globe. Kept as a component (and named SiteHeader) so page.tsx owns the
 * layout, not this.
 */
export function SiteHeader({ dreamCount }: { dreamCount: number }) {
  return (
    <div className="pointer-events-none absolute right-6 top-6 z-10 flex items-center gap-4">
      <span className="meta">{dreamCount} dreams for sale</span>
      <OpenChatButton />
    </div>
  );
}

/**
 * The launcher in the corner only reappears once the chat is closed, so this is
 * the way back in from the top of the page. Rendered inside <CopilotSidebar>
 * (page.tsx is its child), so it can reach the chat through useChatContext.
 */
function OpenChatButton() {
  const { open, setOpen } = useChatContext();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-hidden={open}
      tabIndex={open ? -1 : 0}
      className={`rounded-full border border-line-strong bg-paper-raised px-4 py-1.5 text-sm text-ink transition duration-300 ease-out hover:border-dream hover:text-dream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dream ${
        open ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
      }`}
    >
      Open chat
    </button>
  );
}
