import Link from "next/link";
import type { Metadata } from "next";
import { Container, ParticlesBackground } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Страницата не е намерена - SmolyanVote",
  robots: { index: false, follow: false },
};

/** App Router 404 boundary — replaces v1's static `error/404.html`. */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden">
      <ParticlesBackground theme="white" count={60} />
      <Container className="relative py-20 text-center">
        <p className="text-[clamp(4rem,12vw,7rem)] font-extrabold leading-none text-primary">404</p>
        <h1 className="mt-2 text-[clamp(1.5rem,3.5vw,2rem)] font-bold text-[color:var(--color-text-heading)]">
          Страницата не съществува
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[color:var(--color-text-secondary)]">
          Може би адресът е сгрешен или страницата е премахната.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-6 font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
        >
          <i className="bi bi-house" />
          Начало
        </Link>
      </Container>
    </section>
  );
}
