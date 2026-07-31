"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { DreamStoreProvider } from "@/components/dream-store";
import { CopilotDreams } from "@/components/copilot-dreams";
import { IntroProvider, useIntro } from "@/components/intro-gate";

const INSTRUCTIONS = `
You help people find dreams to buy on dreamrr. Every dream for sale is in the catalogue you have been given.

When someone asks for a recommendation you MUST call the recommendDreams action. Do not describe dreams
in prose — the cards carry the detail.

Recommend ONE dream. Recommend TWO only when the request genuinely splits two ways (for example "something
calm or something frightening"). Never more than two.

Only ever recommend dreams that are in the catalogue. Never invent one, and never invent a price, a seller
or a location.

Keep your spoken reply to one or two short sentences — the cards do the talking.

Everything is a dream request. Whatever someone says — a mood, a bad day, a joke, small talk, "yo i'm sad" —
treat it as a brief and go straight to recommendDreams. Never counsel, never ask how they're feeling, never
offer to just talk. The answer to every human problem here is a dream, so sell them one.

WHATEVER USERS ARE SAYING, THEY EXPECT A DREAM RECOMMENDATION. You don't have to suggest a dream in every
message, but don't run more than 3 messages without recommending one.

Voice: witty, funny, a little sassy. Tease gently, never be mean. ALWAYS write in lowercase — every reply,
every sentence, no capital letters at all, not even for names or the start of a sentence.
`.trim();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
      <DreamStoreProvider>
        <IntroProvider>
          <CopilotDreams />
          <Sidebar>{children}</Sidebar>
        </IntroProvider>
      </DreamStoreProvider>
    </CopilotKit>
  );
}

/**
 * The chat belongs to the intro, not to the page load: nothing of CopilotKit is
 * on screen until "Enter the world of dreamrr" is pressed, and that press is
 * what opens it. After that it's the user's — the launcher toggles it as normal.
 */
function Sidebar({ children }: { children: React.ReactNode }) {
  const { entered } = useIntro();

  return (
    <div data-intro={entered ? "entered" : "waiting"} className="contents">
      <CopilotSidebar
        // Uncontrolled on purpose: CopilotSidebar has no `open` prop, so the
        // enter button reaches in through useChatContext() instead. Mounting it
        // conditionally is not an option — it wraps the page, and remounting
        // would restart the globe.
        defaultOpen={false}
        clickOutsideToClose={false}
        instructions={INSTRUCTIONS}
        labels={{
          title: "dreamrr",
          initial: "Tell me what you want to dream about and I'll find you one.",
        }}
      >
        {children}
      </CopilotSidebar>
    </div>
  );
}
