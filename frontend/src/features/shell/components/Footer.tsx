"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LOGO_NAV } from "@/shared/lib/brandAssets";
import { Container } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { getShellMessages, type Language } from "@/lib/i18n/locales";
import { FooterContactCard } from "@/features/contacts";
import { cn } from "@/shared/lib/cn";
import "./footer.css";

interface FooterProps {
  cookiePreferencesSlot?: ReactNode;
  newsletterSlot?: ReactNode;
  lang: Language;
}

const linkClass =
  "text-[0.8rem] text-[color:var(--color-text-secondary)] transition-colors hover:text-primary";

const SOCIAL = [
  { href: "https://facebook.com/smolyanvote", icon: "bi-facebook", label: "Facebook" },
  { href: "https://www.instagram.com/smolyanvote/", icon: "bi-instagram", label: "Instagram" },
  { href: "https://www.youtube.com/@SmolyanVote", icon: "bi-youtube", label: "YouTube" },
  { href: "https://twitter.com/smolyanvote", icon: "bi-twitter-x", label: "X" },
] as const;

const footerActionCardClass =
  "rounded-[var(--radius-md)] border border-border-default/60 bg-white/80 px-3 py-2.5";

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
    <footer className="site-footer relative mt-auto border-t border-border-default/50 text-[color:var(--color-text-secondary)]">
      <div aria-hidden className="site-footer__base" />
      <div aria-hidden className="site-footer__glow" />
      <div aria-hidden className="site-footer__grid-plane" />
      <div aria-hidden className="site-footer__grid" />
      <div aria-hidden className="site-footer__grid-cells" />
      <div aria-hidden className="site-footer__specular" />
      <div aria-hidden className="site-footer__fade" />
      <div aria-hidden className="site-footer__top-line" />

      <Container className="relative z-10 py-8 md:py-9">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="flex justify-center sm:col-span-2 lg:col-span-1 lg:justify-start">
            <div className="flex w-fit flex-col items-center gap-3.5 lg:items-start">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image
                  src={LOGO_NAV}
                  alt="SmolyanVote"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <span className="bg-gradient-to-r from-[#19861c] to-[#48a24c] bg-clip-text font-sans text-[1.25rem] font-bold tracking-tight text-transparent">
                  SMOLYANVOTE
                </span>
              </Link>

              <div className="flex items-center justify-center gap-2.5">
                {SOCIAL.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-default/80 bg-white text-sm text-[color:var(--color-text-secondary)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <i className={cn("bi", item.icon)} />
                  </a>
                ))}
              </div>

              {isHydrated && (
                <div className="flex min-h-[1.125rem] items-center justify-center lg:justify-start">
                  {!isAuthenticated ? (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => openAuth("login")}
                        className="font-semibold text-[color:var(--color-text-heading)] hover:text-primary"
                      >
                        {t.nav.login}
                      </button>
                      <span className="text-[color:var(--color-text-muted)]">·</span>
                      <button
                        type="button"
                        onClick={() => openAuth("register")}
                        className="font-semibold text-primary hover:underline"
                      >
                        {t.nav.register}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/profile"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t.footer.myProfile}
                    </Link>
                  )}
                </div>
              )}
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

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className={footerActionCardClass}>
            <FooterContactCard
              title={t.footer.contactHeading}
              hint={t.footer.contactHint}
              actionLabel={t.footer.contactCta}
            />
          </div>
          {newsletterSlot && <div className={footerActionCardClass}>{newsletterSlot}</div>}
        </div>

        <div className="mt-5 border-t border-border-default/60 pt-4 text-center">
          <p className="text-xs text-[color:var(--color-text-muted)]">
            © {year} SmolyanVote · {t.footer.copyrightSub}
          </p>
        </div>
      </Container>
    </footer>
  );
}
