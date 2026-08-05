import { Suspense } from "react";
import { resolveApiUrl } from "@/config/env";
import { CrawlerTeaserList } from "@/lib/seo/components/CrawlerTeaserList";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";
import { SignalsPageClient } from "./SignalsPageClient";

export const metadata = buildListingMetadata({
  title: "SmolyanVote - Граждански сигнали",
  description: "Карта на гражданските сигнали в област Смолян — дупки, осветление, замърсяване и други проблеми.",
  path: "/signals",
});

async function fetchSignalTeasers() {
  try {
    const res = await fetch(resolveApiUrl("/api/v1/signals/dataset"), { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ id: number; title: string; description: string }>;
    return data.slice(0, 24).map((s) => ({
      href: `/signals/${s.id}`,
      title: s.title,
      description: s.description,
    }));
  } catch {
    return [];
  }
}

export default async function Signals() {
  const teasers = await fetchSignalTeasers();

  return (
    <>
      <CrawlerTeaserList heading="Граждански сигнали в Смолян" items={teasers} />
      <Suspense>
        <SignalsPageClient />
      </Suspense>
    </>
  );
}
