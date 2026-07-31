"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { DreamStoreProvider } from "@/components/dream-store";
import { CopilotDreams } from "@/components/copilot-dreams";

const INSTRUCTIONS = `
You help people find dreams to buy on dreamrr. Every dream for sale is in the catalogue you have been given.

When someone asks for a recommendation you MUST call the recommendDreams action. Do not describe dreams
in prose — the cards carry the detail.

Recommend ONE dream. Recommend TWO only when the request genuinely splits two ways (for example "something
calm or something frightening"). Never more than two.

Only ever recommend dreams that are in the catalogue. Never invent one, and never invent a price, a seller
or a location.

Keep your spoken reply to one or two short sentences — the cards do the talking.
`.trim();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
      <DreamStoreProvider>
        <CopilotDreams />
        <CopilotSidebar
          defaultOpen
          clickOutsideToClose={false}
          instructions={INSTRUCTIONS}
          labels={{
            title: "dreamrr",
            initial:
              "Tell me what you want to dream about and I'll find you one.",
          }}
        >
          {children}
        </CopilotSidebar>
      </DreamStoreProvider>
    </CopilotKit>
  );
}
