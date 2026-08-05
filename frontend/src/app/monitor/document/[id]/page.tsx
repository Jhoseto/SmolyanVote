import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";
import { buildMonitorDocumentJsonLd } from "@/lib/seo/jsonLd/monitorJsonLd";
import { MonitorDocumentDetailPage } from "@/features/monitor";
import type { MonitorDocumentDetail } from "@/features/monitor";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchDocument(id: string): Promise<MonitorDocumentDetail | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/monitor/document/${id}`), {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as MonitorDocumentDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/monitor/document/${id}`;
  const data = await fetchDocument(id);
  if (!data) {
    return buildSocialMetadata({
      title: "Документ — Граждански монитор",
      path,
      image: brandedOgImageUrl(path),
      type: "article",
    });
  }
  return buildSocialMetadata({
    title: data.title,
    description: data.shortSummary,
    path,
    image: brandedOgImageUrl(path),
    type: "article",
    section: "Монитор",
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchDocument(id);

  return (
    <>
      {data ? (
        <>
          <JsonLd
            data={buildMonitorDocumentJsonLd({
              id: data.id,
              title: data.title,
              shortSummary: data.shortSummary,
              documentType: data.documentType,
              publishedAt: data.publishedAt,
            })}
          />
          <article className="sr-only" aria-label={data.title}>
            <SeoBreadcrumbs
              items={[
                { name: "Начало", href: "/" },
                { name: "Монитор", href: "/monitor" },
                { name: data.title },
              ]}
            />
            <h1>{data.title}</h1>
            {data.shortSummary ? <p>{data.shortSummary}</p> : null}
          </article>
        </>
      ) : null}
      <MonitorDocumentDetailPage />
    </>
  );
}
