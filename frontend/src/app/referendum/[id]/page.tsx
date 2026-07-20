import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata, firstImage } from "@/lib/seo/buildSocialMetadata";
import { ReferendumDetailClient } from "./ReferendumDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/referendum/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return buildSocialMetadata({
      title: data.title,
      description: data.description,
      path: `/referendum/${id}`,
      image: firstImage(data.imageUrls, data.images),
    });
  } catch {
    return buildSocialMetadata({
      title: "Референдум",
      path: `/referendum/${id}`,
      type: "website",
    });
  }
}

export default async function ReferendumDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ReferendumDetailClient id={Number(id)} />;
}
