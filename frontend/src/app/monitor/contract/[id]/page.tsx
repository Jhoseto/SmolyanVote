import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import Link from "next/link";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";
import { buildMonitorContractJsonLd } from "@/lib/seo/jsonLd/monitorJsonLd";
import { MonitorContractDetailPage } from "@/features/monitor";
import type { MonitorContractDetail } from "@/features/monitor";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchContract(id: string): Promise<MonitorContractDetail | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/monitor/contract/${id}`), {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as MonitorContractDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/monitor/contract/${id}`;
  const data = await fetchContract(id);
  if (!data) {
    return buildSocialMetadata({
      title: "Договор — Граждански монитор",
      path,
      image: brandedOgImageUrl(path),
      type: "article",
    });
  }
  return buildSocialMetadata({
    title: data.subject,
    description: data.shortSummary,
    path,
    image: brandedOgImageUrl(path),
    type: "article",
    section: "Монитор",
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchContract(id);

  return (
    <>
      {data ? (
        <>
          <JsonLd
            data={buildMonitorContractJsonLd({
              id: data.id,
              subject: data.subject,
              shortSummary: data.shortSummary,
              amountEur: data.amountEur,
              authorityName: data.authorityName,
              contractorName: data.contractorName,
              publishedAt: data.publicationDate,
            })}
          />
          <article className="sr-only" aria-label={data.subject}>
            <SeoBreadcrumbs
              items={[
                { name: "Начало", href: "/" },
                { name: "Монитор", href: "/monitor" },
                { name: data.subject },
              ]}
            />
            <h1>{data.subject}</h1>
            {data.shortSummary ? <p>{data.shortSummary}</p> : null}
            {data.amountEur != null ? <p>Сума: {data.amountEur} EUR</p> : null}
            {data.contractorName ? <p>Изпълнител: {data.contractorName}</p> : null}
          </article>
        </>
      ) : null}
      <MonitorContractDetailPage />
    </>
  );
}
