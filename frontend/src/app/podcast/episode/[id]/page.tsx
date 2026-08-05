import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata, firstImage } from "@/lib/seo/buildSocialMetadata";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";
import { buildPodcastEpisodeJsonLd } from "@/lib/seo/jsonLd/podcastJsonLd";
import { PodcastEpisodeSocialClient } from "./PodcastEpisodeSocialClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EpisodePayload {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  audioUrl?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
}

async function fetchEpisode(id: string): Promise<EpisodePayload | null> {
  try {
    const res = await fetch(resolveApiUrl("/api/podcast/episodes"), { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const list = (await res.json()) as EpisodePayload[];
    return list.find((e) => e.id === Number(id)) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const episode = await fetchEpisode(id);
  if (!episode) {
    return buildSocialMetadata({
      title: "Подкаст епизод",
      path: `/podcast/episode/${id}`,
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: episode.title,
    description: episode.description,
    path: `/podcast/episode/${id}`,
    image: firstImage(episode.imageUrl),
  });
}

export default async function PodcastEpisodeSocialPage({ params }: PageProps) {
  const { id } = await params;
  const episode = await fetchEpisode(id);

  if (!episode) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Епизодът не е намерен</h1>
        <Link href="/podcast" className="mt-4 inline-block text-primary hover:underline">
          ← Към подкаста
        </Link>
      </div>
    );
  }

  return (
    <>
      <JsonLd data={buildPodcastEpisodeJsonLd(episode)} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <SeoBreadcrumbs
          items={[
            { name: "Начало", href: "/" },
            { name: "Подкаст", href: "/podcast" },
            { name: episode.title },
          ]}
        />
        <h1 className="font-display text-3xl font-bold text-[color:var(--color-text-heading)]">{episode.title}</h1>
        {episode.description ? (
          <p className="mt-4 leading-relaxed text-[color:var(--color-text-secondary)]">{episode.description}</p>
        ) : null}
      </article>
      <Suspense fallback={null}>
        <PodcastEpisodeSocialClient id={Number(id)} />
      </Suspense>
    </>
  );
}
