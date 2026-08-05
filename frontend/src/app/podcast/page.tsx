import { Suspense } from "react";
import { resolveApiUrl } from "@/config/env";
import { PodcastPlayer } from "@/features/podcast";
import { CrawlerTeaserList } from "@/lib/seo/components/CrawlerTeaserList";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";
import { buildPodcastSeriesJsonLd } from "@/lib/seo/jsonLd/podcastJsonLd";

export const metadata = buildListingMetadata({
  title: "SmolyanVote Studio — Подкаст",
  description:
    "SmolyanVote Studio — модерен подкаст за Смолян. Слушай популярни и нови епизоди, търси в реално време и управлявай плейъра от долния dock.",
  path: "/podcast",
});

async function fetchEpisodeTeasers() {
  try {
    const res = await fetch(resolveApiUrl("/api/podcast/episodes"), { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ id: number; title: string; description?: string | null }>;
    return data.slice(0, 20).map((ep) => ({
      href: `/podcast/episode/${ep.id}`,
      title: ep.title,
      description: ep.description,
    }));
  } catch {
    return [];
  }
}

export default async function Podcast() {
  const teasers = await fetchEpisodeTeasers();

  return (
    <>
      <JsonLd data={buildPodcastSeriesJsonLd()} />
      <CrawlerTeaserList heading="Епизоди на SmolyanVote Studio" items={teasers} />
      <Suspense>
        <PodcastPlayer />
      </Suspense>
    </>
  );
}
