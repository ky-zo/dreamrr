import { GlobeStage } from "@/components/globe/globe-stage";
import { DreamPanel } from "@/components/dream-panel";
import { SiteHeader } from "@/components/site-header";
import { dreams } from "@/lib/dreams";

export default function Home() {
  return (
    /* The globe is the page. Everything else sits on top of it. */
    <main className="relative h-dvh overflow-hidden">
      <GlobeStage />
      <SiteHeader dreamCount={dreams.length} />
      <DreamPanel />
    </main>
  );
}
