import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { EventSeoArticle } from "@/lib/seo/components/EventSeoArticle";
import { fetchMultipollDetail } from "@/lib/seo/fetchEventDetail";
import { buildEventJsonLd } from "@/lib/seo/jsonLd/eventJsonLd";
import { MultiPollDetailClient } from "./MultiPollDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/multipoll/${id}`;
  const data = await fetchMultipollDetail(id);
  if (!data) {
    return buildSocialMetadata({
      title: "Анкета",
      path,
      image: brandedOgImageUrl(path),
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: data.title,
    description: data.description,
    path,
    image: brandedOgImageUrl(path),
  });
}

export default async function MultiPollDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchMultipollDetail(id);

  if (!data) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Анкетата не е намерена</h1>
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
        <MultiPollDetailClient id={Number(id)} />
      </Suspense>
    </>
  );
}
