import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/config/env";
import { EventsHubPage } from "@/features/events";
import type { BackendEventType } from "@/features/events/types";
import { CrawlerTeaserList } from "@/lib/seo/components/CrawlerTeaserList";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";

export const metadata = buildListingMetadata({
  title: "SmolyanVote - Всички събития",
  description:
    "Разгледайте активните и приключилите събития, референдуми и анкети в Смолян. Гласувайте и споделете мнението си.",
  path: "/events",
});

function eventHref(type: BackendEventType, id: number): string {
  if (type === "REFERENDUM") return `/referendum/${id}`;
  if (type === "MULTI_POLL") return `/multipoll/${id}`;
  return `/event/${id}`;
}

async function fetchEventTeasers() {
  try {
    const res = await fetch(resolveApiUrl("/api/v1/events"), { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      events?: Array<{ id: number; eventType: BackendEventType; title: string; description: string }>;
    };
    return (data.events ?? []).slice(0, 24).map((e) => ({
      href: eventHref(e.eventType, e.id),
      title: e.title,
      description: e.description,
    }));
  } catch {
    return [];
  }
}

export default async function Events() {
  const teasers = await fetchEventTeasers();

  return (
    <>
      <CrawlerTeaserList heading="Събития и гласувания в Смолян" items={teasers} />
      <Suspense>
        <EventsHubPage />
      </Suspense>
    </>
  );
}
