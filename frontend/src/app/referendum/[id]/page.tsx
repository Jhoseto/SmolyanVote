import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { EventSeoArticle } from "@/lib/seo/components/EventSeoArticle";
import { fetchReferendumDetail } from "@/lib/seo/fetchEventDetail";
import { buildEventJsonLd } from "@/lib/seo/jsonLd/eventJsonLd";
import { ReferendumDetailClient } from "./ReferendumDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/referendum/${id}`;
  const data = await fetchReferendumDetail(id);
  if (!data) {
    return buildSocialMetadata({
      title: "Референдум",
      path,
      image: brandedOgImageUrl(path),
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: data.title,
    description: [data.description, "Гласувай с Да / Не в SmolyanVote"].filter(Boolean).join(" — "),
    path,
    image: brandedOgImageUrl(path),
  });
}

export default async function ReferendumDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchReferendumDetail(id);

  if (!data) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Референдумът не е намерен</h1>
        <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
          ← Към събитията
        </Link>
      </div>
    );
  }

  return (
    <>
      <JsonLd data={buildEventJsonLd(data)} />
      <EventSeoArticle data={data} />
      <Suspense fallback={null}>
        <ReferendumDetailClient id={Number(id)} />
      </Suspense>
    </>
  );
}
