import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { buildSocialMetadata, firstImage } from "@/lib/seo/buildSocialMetadata";
import { PublicationSocialClient } from "./PublicationSocialClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/publications/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return buildSocialMetadata({
      title: data.title,
      description: data.excerpt || data.content,
      path: `/publications/${id}`,
      image: firstImage(data.imageUrl),
    });
  } catch {
    return buildSocialMetadata({
      title: "Публикация",
      path: `/publications/${id}`,
      type: "website",
    });
  }
}

/** Crawler OG surface (V1 `publication-social.html`); UI opens feed modal. */
export default async function PublicationSocialPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicationSocialClient id={Number(id)} />;
}
