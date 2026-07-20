"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { getShellMessages, type Language } from "@/lib/i18n/locales";
import { cn } from "@/shared/lib/cn";

interface FooterProps {
  cookiePreferencesSlot?: ReactNode;
  newsletterSlot?: ReactNode;
  lang: Language;
}

const linkClass =
  "text-[0.8rem] text-[color:var(--color-text-secondary)] transition-colors hover:text-primary";

const SOCIAL = [
  { href: "https://facebook.com/smolyanvote", icon: "bi-facebook", label: "Facebook" },
  { href: "https://twitter.com/smolyanvote", icon: "bi-twitter-x", label: "X" },
] as const;

/** Compact site footer — dense columns, auth CTAs for guests only. */
export function Footer({ cookiePreferencesSlot, newsletterSlot, lang }: FooterProps) {
  const t = getShellMessages(lang);
  const { isAuthenticated, isHydrated } = useAuth();
  const openAuth = useLoginGateStore((s) => s.open);
  const year = new Date().getFullYear();

  const NAVIGATION = [
    { label: t.nav.home, href: "/" },
    { label: t.footer.nav.events, href: "/events" },
    { label: t.footer.nav.publications, href: "/publications" },
    { label: t.nav.signals, href: "/signals" },
    { label: t.nav.podcast, href: "/podcast" },
    { label: t.footer.nav.about, href: "/about" },
    { label: t.footer.nav.faq, href: "/faq" },
    { label: t.nav.contacts, href: "/contacts" },
  ];

  const PARTICIPATE = [
    { label: t.footer.participate.createEvent, href: "/event/new" },
    { label: t.footer.participate.createReferendum, href: "/referendum/new" },
    { label: t.footer.participate.createPoll, href: "/multipoll/new" },
    {
      label: t.footer.participate.downloadApp,
      href: "/svmessenger.apk",
      download: true,
    },
  ];

  const LEGAL = [
    { label: t.footer.legal.terms, href: "/terms-and-conditions" },
    { label: t.footer.legal.cookies, href: "/terms-and-conditions#cookies" },
  ];

  return (
    <footer className="relative mt-auto border-t border-border-default/70 text-[color:var(--color-text-secondary)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,#fbfcfd_0%,#f3f5f8_100%)]"
      />

      <Container className="relative z-10 py-8 md:py-9">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-gradient-brand text-xl font-extrabold tracking-[-0.03em]">
              SmolyanVote
            </p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
              {t.footer.tagline}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {SOCIAL.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-default bg-white text-xs text-[color:var(--color-text-secondary)] transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <i className={cn("bi", item.icon)} />
                </a>
              ))}
              {isHydrated &&
                (!isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openAuth("login")}
                      className="ml-1 text-xs font-semibold text-[color:var(--color-text-heading)] hover:text-primary"
                    >
                      {t.nav.login}
                    </button>
                    <span className="text-[color:var(--color-text-muted)]">·</span>
                    <button
                      type="button"
                      onClick={() => openAuth("register")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t.nav.register}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/profile"
                    className="ml-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {t.footer.myProfile}
                  </Link>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              {t.footer.navHeading}
            </h4>
            <nav className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {NAVIGATION.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              {t.footer.participateHeading}
            </h4>
            <nav className="mt-2.5 flex flex-col gap-1.5">
              {PARTICIPATE.map((link) =>
                "download" in link && link.download ? (
                  <a key={link.href} href={link.href} download className={linkClass}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          <div>
            <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              {t.footer.legalHeading}
            </h4>
            <nav className="mt-2.5 flex flex-col gap-1.5">
              {LEGAL.map((link) => (
                <Link key={link.label} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
              {cookiePreferencesSlot}
            </nav>
            <div className="mt-3 flex flex-col gap-1 text-[0.8rem] text-[color:var(--color-text-muted)]">
              <a href="mailto:smolyanvote@gmail.com" className={linkClass}>
                smolyanvote@gmail.com
              </a>
              <span>{t.footer.location}</span>
            </div>
          </div>
        </div>

        {newsletterSlot && (
          <div className="mt-6 rounded-[var(--radius-md)] border border-border-default/60 bg-white/80 px-3 py-2">
            {newsletterSlot}
          </div>
        )}

        <div className="mt-5 border-t border-border-default/60 pt-4 text-center">
          <p className="text-xs text-[color:var(--color-text-muted)]">
            © {year} SmolyanVote · {t.footer.copyrightSub}
          </p>
        </div>
      </Container>
    </footer>
  );
}
