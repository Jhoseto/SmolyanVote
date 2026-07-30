import type { Metadata } from "next";
import { resolveApiUrl } from "@/config/env";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
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

export default function Page() {
  return <MonitorContractDetailPage />;
}
