import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata, firstImage } from "@/lib/seo/buildSocialMetadata";
import { MultiPollDetailClient } from "./MultiPollDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/multipoll/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return buildSocialMetadata({
      title: data.title,
      description: data.description,
      path: `/multipoll/${id}`,
      image: firstImage(data.imageUrls, data.images),
    });
  } catch {
    return buildSocialMetadata({
      title: "Анкета",
      path: `/multipoll/${id}`,
      type: "website",
    });
  }
}

export default async function MultiPollDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MultiPollDetailClient id={Number(id)} />;
}
