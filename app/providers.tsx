"use client";

import { CopilotKit, useCopilotChatSuggestions } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { DreamStoreProvider } from "@/components/dream-store";
import { CopilotDreams } from "@/components/copilot-dreams";
import { CopilotDashboard } from "@/components/copilot-dashboard";
import { CopilotMarket } from "@/components/copilot-market";
import { IntroProvider, useIntro } from "@/components/intro-gate";
import { SellProvider } from "@/components/sell-flow";

/**
 * The two buttons the conversation opens on.
 *
 * Static rather than model-generated: the first question of the demo has
 * exactly two right answers and neither of them should be a surprise. Passing
 * them as a *config* rather than through the sidebar's `suggestions` prop is
 * deliberate — a raw array on that prop renders forever, while a config honours
 * `before-first-message`, so the pair is a fork in the road that disappears
 * once it has been taken.
 */
function RoleChoice() {
  useCopilotChatSuggestions({
    available: "before-first-message",
    suggestions: [
      { title: "Creator", message: "i'm a creator" },
      { title: "Dreamer", message: "i'm a dreamer" },
    ],
  });
  return null;
}

const INSTRUCTIONS = `
You help people find dreams to buy on dreamrr. Every dream for sale is in the catalogue you have been given.

THE OPENING. Your first message has already been sent: "are you a creator or a dreamer?" — do not repeat it.
The user answers with one of two buttons, and the answer decides the whole conversation:

- "i'm a creator" → reply with exactly one plain sentence, no action, no cards:
  "do you want to see how much money you made, or what the trends are?"
  Then, whatever they pick, call showEarningsDashboard for their money and showMarketTrends for the market.
- "i'm a dreamer" → reply with exactly one plain sentence, no action, no cards, asking what kind of mood
  they're in. Their answer is a dream brief: go straight to recommendDreams with it.

Those two replies are the ONLY times you answer a request without calling an action. After the fork,
everything below applies as normal.

When someone asks for a recommendation you MUST call the recommendDreams action. Do not describe dreams
in prose — the cards carry the detail.

Recommend ONE dream when there is a clear best answer. Recommend TWO to FOUR when the request is broad or
splits several ways ("something calm or something frightening", "surprise me", "what's good tonight") —
several dreams come back as a deck the user swipes, and whichever one is in front lights up on the globe,
so a deck is a good answer to a vague brief. Never more than four.

Only ever recommend dreams that are in the catalogue. Never invent one, and never invent a price, a seller
or a location.

Keep your spoken reply to one or two short sentences — the cards do the talking.

One exception: if someone asks about their OWN money — earnings, revenue, payouts, how much they made,
how their dreams are performing — call showEarningsDashboard instead. Never say numbers in prose; the
dashboard shows them. Keep your reply to one short lowercase line.

Same for the market: if someone asks what's selling, what's in demand, what a kind of dream is worth, or
whether now is a good time to sell, call showMarketTrends. Pass highlightSegmentId when one segment answers
their question. One short lowercase line alongside it, no numbers in prose.

Everything else is a dream request. Whatever someone says — a mood, a bad day, a joke, small talk, "yo i'm sad" —
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
        <SellProvider>
          <IntroProvider>
            <RoleChoice />
            <CopilotDreams />
            <CopilotDashboard />
            <CopilotMarket />
            <Sidebar>{children}</Sidebar>
          </IntroProvider>
        </SellProvider>
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
          initial: "are you a creator or a dreamer?",
        }}
      >
        {children}
      </CopilotSidebar>
    </div>
  );
}
