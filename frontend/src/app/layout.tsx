import type { Metadata, Viewport } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { Footer } from "@/features/shell";
import { ShellNavbar } from "./ShellNavbar";
import { NotificationBell } from "@/features/notifications";
import { CookiePreferencesLink } from "@/features/cookie-consent";
import { NewsletterSubscribeButton } from "@/features/newsletter";
import { DeferredStylesheet } from "@/shared/ui/DeferredStylesheet";
import {
  BOOTSTRAP_ICONS_CSS,
  BOOTSTRAP_ICONS_SHELL_CSS,
  DESKTOP_FONT_PRELOAD_MANROPE_CY,
  DESKTOP_FONTS_CSS,
  FLAG_ICONS_CSS,
  FOOTER_CSS,
  MOBILE_FONT_PRELOAD_MANROPE_500_CY,
  MOBILE_FONTS_CSS,
} from "@/shared/lib/fontUrls";
import { getShellMessages, resolveLanguageFromGoogtransCookie } from "@/lib/i18n/locales";

/**
 * Manrope cyrillic+latin only (~1.8 KB). Inlined under a mobile media query
 * so the hero title never waits on a fonts.css round-trip. Desktop fonts stay
 * as a separate cacheable stylesheet (inlining both previously bloated HTML
 * and hurt the desktop score).
 */
const MOBILE_CRITICAL_FONT_CSS = readFileSync(
  join(process.cwd(), "public/fonts/mobile/fonts-critical.css"),
  "utf8",
);

const SITE_URL = "https://smolyanvote.com";
const SITE_NAME = "SmolyanVote";
const SITE_TITLE = "SmolyanVote - Гласът на Смолян | Вашият глас Вашият град Вашето мнение";
const SITE_DESCRIPTION =
  "Независима платформа за истинско гражданско участие в Смолян. Гласувания, граждански сигнали, публикации и общност — вашият глас има значение.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "SmolyanVote",
    "Смолян",
    "гражданско участие",
    "гласуване",
    "референдум",
    "граждански сигнали",
    "публикации",
    "Родопи",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "bg_BG",
    images: [
      {
        url: "/images/SMVshare.JPG",
        width: 1200,
        height: 630,
        alt: "SmolyanVote — Гласът на Смолян",
      },
      {
        url: "/images/logoNew.png",
        width: 563,
        height: 567,
        alt: "SmolyanVote лого",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@SmolyanVote",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/SMVshare.JPG"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Prevent Chrome/browser auto-translate bar; site uses its own LanguageSwitcher.
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#19861c" },
    { media: "(prefers-color-scheme: dark)", color: "#19861c" },
  ],
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: ["Smolyan Vote", "СмолянВоут"],
  url: SITE_URL,
  logo: `${SITE_URL}/images/logoNew.png`,
  image: `${SITE_URL}/images/SMVshare.JPG`,
  description: SITE_DESCRIPTION,
  foundingLocation: {
    "@type": "Place",
    name: "Смолян, България",
  },
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Област Смолян",
  },
  sameAs: [
    "https://facebook.com/smolyanvote",
    "https://www.instagram.com/smolyanvote/",
    "https://www.youtube.com/@SmolyanVote",
    "https://twitter.com/smolyanvote",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "smolyanvote@gmail.com",
    availableLanguage: ["Bulgarian", "English"],
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "bg-BG",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/logoNew.png`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/publications?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const lang = resolveLanguageFromGoogtransCookie(cookieStore.get("googtrans")?.value);
  const t = getShellMessages(lang);

  return (
    <html lang="bg" className="h-full antialiased" suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. bis_register) mutate <body> before hydrate */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        {/*
          Fonts + icon packs (React 19 hoists to <head>).
          Desktop: cacheable external sheet (media-guarded — not blocking on mobile).
          Mobile: ~1.8 KB Manrope critical faces inlined; full Inter/Source/IBM
          sheet is non-blocking so it never competes with the LCP hero image on
          Slow 4G. Footer CSS is below-fold and also non-blocking.
        */}
        <link
          rel="stylesheet"
          href={DESKTOP_FONTS_CSS}
          media="(min-width: 768px)"
          precedence="default"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `@media (max-width:767px){${MOBILE_CRITICAL_FONT_CSS}}`,
          }}
        />
        <link
          rel="preload"
          href={DESKTOP_FONT_PRELOAD_MANROPE_CY}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          href={MOBILE_FONT_PRELOAD_MANROPE_500_CY}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          media="(max-width: 767px)"
        />
        {/* Full mobile fonts (Inter / Source Sans / IBM) — AFTER first paint so
            their ~140 KB of woff2 never steal Slow-4G bandwidth from the LCP
            hero image. Body text briefly uses system-ui (font-display: swap). */}
        <DeferredStylesheet
          href={MOBILE_FONTS_CSS}
          idleTimeoutMs={400}
          matchMedia="(max-width: 767px)"
        />
        {/* Below-fold footer decoration — never on the LCP critical path. */}
        <DeferredStylesheet href={FOOTER_CSS} idleTimeoutMs={600} />
        <DeferredStylesheet
          href={BOOTSTRAP_ICONS_SHELL_CSS}
          idleTimeoutMs={400}
          matchMedia="(min-width: 768px)"
        />
        <DeferredStylesheet
          href={BOOTSTRAP_ICONS_CSS}
          idleTimeoutMs={3000}
          matchMedia="(min-width: 768px)"
        />
        <DeferredStylesheet
          href={BOOTSTRAP_ICONS_SHELL_CSS}
          idleTimeoutMs={1200}
          matchMedia="(max-width: 767px)"
        />
        {/* Shell subset alone covers homepage icon usage — full sheet later. */}
        <DeferredStylesheet
          href={BOOTSTRAP_ICONS_CSS}
          idleTimeoutMs={8000}
          matchMedia="(max-width: 767px)"
        />
        <DeferredStylesheet href={FLAG_ICONS_CSS} matchMedia="(max-width: 767px)" />
        <DeferredStylesheet
          href={FLAG_ICONS_CSS}
          idleTimeoutMs={2500}
          matchMedia="(min-width: 768px)"
        />

        <AppProviders>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-[var(--shadow-lg)]"
          >
            Към съдържанието
          </a>
          <ShellNavbar notificationSlot={<NotificationBell />} lang={lang} />
          <main
            id="main-content"
            className="flex-1 pt-[var(--navbar-offset)]"
            tabIndex={-1}
          >
            {children}
          </main>
          <Footer
            cookiePreferencesSlot={
              <CookiePreferencesLink className="text-left text-[0.8rem] text-[color:var(--color-text-secondary)] transition-colors hover:text-primary" />
            }
            newsletterSlot={
              <NewsletterSubscribeButton
                title={t.footer.newsletterTitle}
                hint={t.footer.newsletterHint}
              />
            }
            lang={lang}
          />
        </AppProviders>
      </body>
    </html>
  );
}
