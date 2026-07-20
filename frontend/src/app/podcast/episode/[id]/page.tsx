import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata, firstImage } from "@/lib/seo/buildSocialMetadata";
import { PodcastEpisodeSocialClient } from "./PodcastEpisodeSocialClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(resolveApiUrl("/api/podcast/episodes"), {
      next: { revalidate: 120 },
    });
    if (!res.ok) throw new Error("not found");
    const list = (await res.json()) as Array<{
      id: number;
      title: string;
      description: string | null;
      imageUrl: string | null;
    }>;
    const episode = list.find((e) => e.id === Number(id));
    if (!episode) throw new Error("not found");
    return buildSocialMetadata({
      title: episode.title,
      description: episode.description,
      path: `/podcast/episode/${id}`,
      image: firstImage(episode.imageUrl),
    });
  } catch {
    return buildSocialMetadata({
      title: "Подкаст епизод",
      path: `/podcast/episode/${id}`,
      type: "website",
    });
  }
}

/** Crawler OG surface (V1 `podcast-episode-social.html`); deep-links into player. */
export default async function PodcastEpisodeSocialPage({ params }: PageProps) {
  const { id } = await params;
  return <PodcastEpisodeSocialClient id={Number(id)} />;
}
