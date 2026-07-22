import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { ReferendumDetailClient } from "./ReferendumDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/referendum/${id}`;
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/referendum/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const desc = [data.description, "Гласувай с Да / Не в SmolyanVote"].filter(Boolean).join(" — ");
    return buildSocialMetadata({
      title: data.title,
      description: desc,
      path,
      image: brandedOgImageUrl(path),
    });
  } catch {
    return buildSocialMetadata({
      title: "Референдум",
      path,
      image: brandedOgImageUrl(path),
      type: "website",
    });
  }
}

export default async function ReferendumDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ReferendumDetailClient id={Number(id)} />;
}
