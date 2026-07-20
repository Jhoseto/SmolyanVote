import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { Footer } from "@/features/shell";
import { ShellNavbar } from "./ShellNavbar";
import { NotificationBell } from "@/features/notifications";
import { CookiePreferencesLink } from "@/features/cookie-consent";
import { NewsletterSubscribeButton } from "@/features/newsletter";
import { getShellMessages, resolveLanguageFromGoogtransCookie } from "@/lib/i18n/locales";

export const metadata: Metadata = {
  metadataBase: new URL("https://smolyanvote.com"),
  title: "SmolyanVote - Гласът на Смолян | Вашият глас Вашият град Вашето мнение",
  description:
    "Независима платформа за истинско гражданско участие в Смолян. Вашият глас има значение.",
  // Prevent Chrome/browser auto-translate bar; site uses its own LanguageSwitcher.
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        {/*
          Fonts + icon packs loaded browser-side (React 19 hoists to <head>).
          Google Fonts via <link> instead of next/font to keep the build
          network-independent (matches v1 approach). Cyrillic subsets included.
        */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          precedence="default"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
          precedence="default"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap&subset=cyrillic,latin"
          precedence="default"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
          precedence="default"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css"
          precedence="default"
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
            className="flex-1 pt-[var(--navbar-height)]"
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
