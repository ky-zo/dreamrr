import { GlobeStage } from "@/components/globe/globe-stage";
import { DreamDownload } from "@/components/dream-download";
import { DreamPanel } from "@/components/dream-panel";
import { AfterIntro, IntroOverlay } from "@/components/intro-gate";
import { SiteHeader } from "@/components/site-header";
import { dreams } from "@/lib/dreams";

export default function Home() {
  return (
    <>
      {/* The globe is the page. Everything else sits on top of it. */}
      <main className="relative h-dvh overflow-hidden">
        {/* <IntroProvider> is up in app/providers.tsx — the chat sidebar sits
            above this page in the tree and has to react to the intro too. */}
        <GlobeStage />
        <AfterIntro>
          <SiteHeader dreamCount={dreams.length} />
          <DreamPanel />
        </AfterIntro>
        <IntroOverlay />
      </main>
      {/* Outside <main> on purpose: <main> is what implodes behind it. */}
      <DreamDownload />
    </>
  );
}
