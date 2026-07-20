import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata, firstImage } from "@/lib/seo/buildSocialMetadata";
import { SimpleEventDetailClient } from "./SimpleEventDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/simple/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return buildSocialMetadata({
      title: data.title,
      description: data.description,
      path: `/event/${id}`,
      image: firstImage(data.images),
    });
  } catch {
    return buildSocialMetadata({
      title: "Събитие",
      path: `/event/${id}`,
      type: "website",
    });
  }
}

export default async function SimpleEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SimpleEventDetailClient id={Number(id)} />;
}
