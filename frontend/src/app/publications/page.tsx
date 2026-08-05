import { Suspense } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/config/env";
import { PublicationsPageClient } from "./PublicationsPageClient";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";

export const metadata = buildListingMetadata({
  title: "Публикации — местната социална лента на Смолян",
  description:
    "Новини, инициативи и мнения от жителите на Смолян. Граждански дискусии, харесвания и коментари в местната социална мрежа SmolyanVote.",
  path: "/publications",
});

interface Teaser {
  id: number;
  title: string;
  excerpt?: string | null;
  content?: string;
}

async function fetchTeasers(): Promise<Teaser[]> {
  try {
    const res = await fetch(resolveApiUrl("/api/v1/publications?page=0&size=12&sort=date-desc"), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { content?: Teaser[] };
    return data.content ?? [];
  } catch {
    return [];
  }
}

export default async function Publications() {
  const teasers = await fetchTeasers();

  return (
    <>
      {/* Crawler / AI teaser list — indexable links to SSR articles */}
      {teasers.length > 0 && (
        <section className="sr-only" aria-label="Последни публикации">
          <h2>Последни публикации</h2>
          <ul>
            {teasers.map((t) => (
              <li key={t.id}>
                <Link href={`/publications/${t.id}`}>{t.title}</Link>
                <p>{(t.excerpt || t.content || "").slice(0, 160)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Suspense>
        <PublicationsPageClient />
      </Suspense>
    </>
  );
}
