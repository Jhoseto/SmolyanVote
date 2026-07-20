"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container, ParticlesBackground } from "@/shared/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-segment error boundary — replaces v1's `error/general_error.html` + `error/403.html`. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden">
      <ParticlesBackground theme="white" count={60} />
      <Container className="relative py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-error)]/10">
          <i className="bi bi-exclamation-triangle text-[1.75rem] text-[color:var(--color-error)]" />
        </div>
        <h1 className="mt-4 text-[clamp(1.5rem,3.5vw,2rem)] font-bold text-[color:var(--color-text-heading)]">
          Възникна грешка
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[color:var(--color-text-secondary)]">
          Нещо се обърка при зареждането на тази страница. Моля, опитайте отново.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-6 font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
          >
            <i className="bi bi-arrow-clockwise" />
            Опитай отново
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-primary/40 bg-white/60 px-6 font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-50"
          >
            <i className="bi bi-house" />
            Начало
          </Link>
        </div>
      </Container>
    </section>
  );
}
