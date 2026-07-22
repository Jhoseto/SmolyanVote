import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { SimpleEventDetailClient } from "./SimpleEventDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/event/${id}`;
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/events/simple/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const desc = [data.description, "Участвай в гласуването на SmolyanVote"]
      .filter(Boolean)
      .join(" — ");
    return buildSocialMetadata({
      title: data.title,
      description: desc,
      path,
      image: brandedOgImageUrl(path),
    });
  } catch {
    return buildSocialMetadata({
      title: "Събитие",
      path,
      image: brandedOgImageUrl(path),
      type: "website",
    });
  }
}

export default async function SimpleEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SimpleEventDetailClient id={Number(id)} />;
}
