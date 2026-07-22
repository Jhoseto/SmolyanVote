import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/config/env";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { buildPublicationJsonLd } from "@/lib/seo/publicationJsonLd";
import { Container } from "@/shared/ui";
import { PublicationSocialClient } from "./PublicationSocialClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PublicationPayload {
  id: number;
  title: string;
  content: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  authorUsername?: string | null;
  authorId?: number | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  category?: string | null;
}

async function fetchPublication(id: string): Promise<PublicationPayload | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/publications/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicationPayload;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/publications/${id}`;
  const data = await fetchPublication(id);
  if (!data) {
    return buildSocialMetadata({
      title: "Публикация",
      path,
      image: brandedOgImageUrl(path),
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: data.title,
    description: data.excerpt || data.content,
    path,
    image: brandedOgImageUrl(path),
    publishedTime: data.createdAt,
    modifiedTime: data.updatedAt,
    authors: data.authorUsername ? [data.authorUsername] : undefined,
    section: data.category,
  });
}

/** Indexable SSR article + progressive social modal for humans. */
export default async function PublicationSocialPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchPublication(id);

  if (!data) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-xl font-semibold">Публикацията не е намерена</h1>
        <Link href="/publications" className="mt-4 inline-block text-primary hover:underline">
          ← Към публикациите
        </Link>
      </Container>
    );
  }

  const jsonLd = buildPublicationJsonLd(data);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 text-sm text-[color:var(--color-text-muted)]">
          <Link href="/" className="hover:text-primary">
            Начало
          </Link>
          <span className="mx-2">/</span>
          <Link href="/publications" className="hover:text-primary">
            Публикации
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[color:var(--color-text-secondary)]">{data.title}</span>
        </nav>

        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-[color:var(--color-text-heading)]">
            {data.title}
          </h1>
          <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
            {data.authorUsername ? (
              <>
                От{" "}
                <Link
                  href={`/user/${encodeURIComponent(data.authorUsername)}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {data.authorUsername}
                </Link>
              </>
            ) : (
              "Автор неизвестен"
            )}
            {" · "}
            <time dateTime={data.createdAt}>
              {new Date(data.createdAt).toLocaleDateString("bg-BG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {data.category ? ` · ${data.category}` : ""}
          </p>
          <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
            {data.likesCount ?? 0} харесвания · {data.commentsCount ?? 0} коментара ·{" "}
            {data.sharesCount ?? 0} споделяния · {data.viewsCount ?? 0} прегледа
          </p>
        </header>

        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary
          <img
            src={data.imageUrl}
            alt={data.title}
            className="mb-6 max-h-[480px] w-full rounded-[var(--radius-lg)] object-cover"
          />
        ) : null}

        <div className="whitespace-pre-line text-base leading-relaxed text-[color:var(--color-text-secondary)]">
          {data.content}
        </div>

        <footer className="mt-10 border-t border-border-default/60 pt-6 text-sm">
          <Link href="/publications" className="font-semibold text-primary hover:underline">
            ← Всички публикации
          </Link>
          {data.authorUsername ? (
            <>
              {" · "}
              <Link
                href={`/user/${encodeURIComponent(data.authorUsername)}`}
                className="font-semibold text-primary hover:underline"
              >
                Профил на {data.authorUsername}
              </Link>
            </>
          ) : null}
        </footer>
      </article>

      <Suspense fallback={null}>
        <PublicationSocialClient id={data.id} />
      </Suspense>
    </>
  );
}
