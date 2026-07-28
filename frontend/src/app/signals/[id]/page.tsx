import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/config/env";
import { brandedOgImageUrl, buildSocialMetadata } from "@/lib/seo/buildSocialMetadata";
import { Container } from "@/shared/ui";
import { categoryIcon } from "@/features/signals/data/categories";
import type { Signal } from "@/features/signals/types";
import { SignalSocialClient } from "./SignalSocialClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchSignal(id: string): Promise<Signal | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/v1/signals/${id}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Signal;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/signals/${id}`;
  const data = await fetchSignal(id);
  if (!data) {
    return buildSocialMetadata({
      title: "Граждански сигнал",
      path,
      image: brandedOgImageUrl(path),
      type: "website",
    });
  }
  return buildSocialMetadata({
    title: data.title,
    description: data.description,
    path,
    image: data.imageUrl ?? brandedOgImageUrl(path),
    publishedTime: data.createdAt,
    modifiedTime: data.modifiedAt,
    authors: data.authorUsername ? [data.authorUsername] : undefined,
    section: data.categoryLabel,
  });
}

/** Indexable SSR signal page + progressive map modal for humans. */
export default async function SignalSocialPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchSignal(id);

  if (!data) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-xl font-semibold">Сигналът не е намерен</h1>
        <Link href="/signals" className="mt-4 inline-block text-primary hover:underline">
          ← Към картата на сигналите
        </Link>
      </Container>
    );
  }

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 text-sm text-[color:var(--color-text-muted)]">
          <Link href="/" className="hover:text-primary">
            Начало
          </Link>
          <span className="mx-2">/</span>
          <Link href="/signals" className="hover:text-primary">
            Сигнали
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
                <Link href={`/user/${encodeURIComponent(data.authorUsername)}`} className="font-semibold text-primary hover:underline">
                  {data.authorUsername}
                </Link>
              </>
            ) : (
              "Автор неизвестен"
            )}
            {" · "}
            <time dateTime={data.createdAt}>
              {new Date(data.createdAt).toLocaleDateString("bg-BG", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            {" · "}
            <i className={`bi ${categoryIcon(data.category)} mr-1`} />
            {data.categoryLabel}
          </p>
          <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
            {data.priorityBoostCount} вдигания · {data.viewsCount} прегледа · {data.commentsCount} коментара
            {data.isResolved ? " · Решен" : data.isActive ? " · Активен" : " · Неактивен"}
          </p>
        </header>

        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt={data.title} className="mb-6 max-h-[480px] w-full rounded-[var(--radius-lg)] object-cover" />
        ) : null}

        <div className="whitespace-pre-line text-base leading-relaxed text-[color:var(--color-text-secondary)]">{data.description}</div>

        <footer className="mt-10 border-t border-border-default/60 pt-6 text-sm">
          <Link href="/signals" className="font-semibold text-primary hover:underline">
            ← Картата на сигналите
          </Link>
        </footer>
      </article>

      <Suspense fallback={null}>
        <SignalSocialClient id={data.id} />
      </Suspense>
    </>
  );
}
