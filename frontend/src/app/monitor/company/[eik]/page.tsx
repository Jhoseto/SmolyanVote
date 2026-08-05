import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { MonitorCompanyPage } from "@/features/monitor";
import { buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { SeoBreadcrumbs } from "@/lib/seo/components/SeoBreadcrumbs";

interface PageProps {
  params: Promise<{ eik: string }>;
}

async function fetchCompany(eik: string) {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/monitor/company/${eik}`), {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      name?: string;
      eik?: string;
      legalForm?: string | null;
      registeredAddress?: string | null;
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eik } = await params;
  const path = `/monitor/company/${eik}`;
  const data = await fetchCompany(eik);
  if (!data?.name) {
    return buildSocialMetadata({
      title: `Компания ${eik}`,
      path,
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: `${data.name} — Граждански монитор`,
    description:
      [data.legalForm, data.registeredAddress].filter(Boolean).join(" · ") ||
      `Профил на фирма ${data.name} (ЕИК ${eik}) в контекста на общински поръчки в Смолян.`,
    path,
    type: "article",
    section: "Монитор",
  });
}

export default async function Page({ params }: PageProps) {
  const { eik } = await params;
  const data = await fetchCompany(eik);

  return (
    <>
      {data?.name ? (
        <article className="sr-only" aria-label={data.name}>
          <SeoBreadcrumbs
            items={[
              { name: "Начало", href: "/" },
              { name: "Монитор", href: "/monitor" },
              { name: data.name },
            ]}
          />
          <h1>{data.name}</h1>
          <p>ЕИК: {eik}</p>
          {data.legalForm ? <p>{data.legalForm}</p> : null}
          {data.registeredAddress ? <p>{data.registeredAddress}</p> : null}
        </article>
      ) : null}
      <MonitorCompanyPage />
    </>
  );
}
