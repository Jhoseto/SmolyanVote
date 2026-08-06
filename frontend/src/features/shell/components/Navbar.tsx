"use client";

import Link from "next/link";
import { LOGO_NAV } from "@/shared/lib/brandAssets";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { hapticTap } from "@/shared/lib/haptic";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { Avatar } from "@/shared/ui";
import { getShellMessages, type Language } from "@/lib/i18n/locales";
import { NAV_ITEMS } from "../data/navItems";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { VoteNavMenu } from "./VoteNavMenu";
import { MonitorNavMenu } from "./MonitorNavMenu";

interface NavbarProps {
  notificationSlot?: ReactNode;
  lang: Language;
}

/** Fixed glass navbar — visual parity with v1 `navbar-glassmorphism`. */
export function Navbar({ notificationSlot, lang }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<"vote" | "monitor" | "profile" | null>(null);
  const pathname = usePathname();
  const t = getShellMessages(lang);
  const { isAuthenticated, isHydrated, user } = useAuth();
  const openAuth = useLoginGateStore((s) => s.open);

  function closeMobileNav() {
    setMobileOpen(false);
    setMobileSubmenu(null);
  }

  function handleLoginClick() {
    hapticTap();
    closeMobileNav();
    openAuth("login");
  }

  function handleRegisterClick() {
    hapticTap();
    closeMobileNav();
    openAuth("register");
  }

  /** Already on home → scroll to top instead of a no-op navigation. */
  function handleHomeNavClick(e: MouseEvent) {
    if (pathname !== "/") return;
    e.preventDefault();
    hapticTap();
    closeMobileNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-[1030] w-full">
      <div
        className="flex w-full items-center justify-center border-b border-black/[0.06] px-4 py-2.5 shadow-[var(--shadow-navbar-2)] backdrop-blur-xl backdrop-saturate-150 sm:px-6 lg:px-8 xl:px-10"
        style={{
          background: "var(--gradient-navbar)",
          minHeight: "var(--navbar-height)",
        }}
      >
        <div className="relative flex w-full max-w-[1600px] items-center justify-between">
          {/* Left — logo */}
          <Link
            href="/"
            onClick={handleHomeNavClick}
            className="relative z-10 flex shrink-0 items-center gap-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_NAV}
              alt="SmolyanVote"
              width={40}
              height={40}
              decoding="async"
              className="h-10 w-10 object-contain"
            />
            <span className="bg-gradient-to-r from-[#19861c] to-[#48a24c] bg-clip-text font-sans text-[1.25rem] font-bold tracking-tight text-transparent">
              SMOLYANVOTE
            </span>
          </Link>

          {/* Center — nav links (absolute so logo/right never wrap) */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center xl:flex">
            <div className="pointer-events-auto flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                if (item.key === "vote") {
                  return <VoteNavMenu key="vote" label={t.nav.vote} />;
                }
                if (item.key === "monitor") {
                  return <MonitorNavMenu key="monitor" label={t.nav.monitor} />;
                }
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={item.href === "/" ? handleHomeNavClick : undefined}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 font-sans text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-nav-muted)] transition-all duration-200 hover:bg-black/[0.035] hover:text-primary",
                      active && "bg-primary-50 text-primary",
                    )}
                  >
                    <i
                      className={cn(
                        "bi text-[1.05rem]",
                        item.icon,
                        active ? "text-primary" : "text-[color:var(--color-text-nav-muted)]",
                      )}
                    />
                    <span>{t.nav[item.key]}</span>
                  </Link>
                );
              })}
              <span className="mx-1 h-5 w-px shrink-0 bg-black/[0.08]" aria-hidden />
              <LanguageSwitcher label={t.nav.languages} />
            </div>
          </div>

          {/* Right — desktop auth + notifications */}
          <div className="relative z-10 hidden shrink-0 items-center gap-2 xl:flex">
            {!isHydrated ? (
              <div className="h-10 w-28" aria-hidden />
            ) : isAuthenticated ? (
              <UserMenu logoutLabel={t.nav.logout} />
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="rounded-full px-4 py-2.5 font-sans text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-nav)] transition-all duration-200 hover:bg-black/[0.035] hover:text-primary"
                >
                  {t.nav.login}
                </button>
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className="btn-brand rounded-full px-5 py-2.5 font-sans text-[0.875rem] font-normal tracking-wide shadow-[var(--shadow-md)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(25,134,28,0.32)]"
                >
                  {t.nav.register}
                </button>
              </>
            )}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {isHydrated ? notificationSlot : null}
            </div>
          </div>

          {/* Right — mobile */}
          <div className="relative z-10 flex shrink-0 items-center gap-0.5 xl:hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {isHydrated ? notificationSlot : null}
            </div>
            {isHydrated && isAuthenticated && user ? (
              <Link
                href="/profile"
                aria-label="Моят профил"
                onClick={() => hapticTap()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              >
                <Avatar username={user.username} imageUrl={user.imageUrl} size={32} />
              </Link>
            ) : null}
            <button
              type="button"
              aria-label={t.nav.menu}
              aria-expanded={mobileOpen}
              onClick={() => {
                hapticTap();
                setMobileOpen((v) => {
                  if (v) setMobileSubmenu(null);
                  return !v;
                });
              }}
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5"
            >
              <span
                className={cn(
                  "block h-0.5 w-6 rounded-full bg-[color:var(--color-text-nav)] transition-all",
                  mobileOpen && "translate-y-2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-6 rounded-full bg-[color:var(--color-text-nav)] transition-all",
                  mobileOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-6 rounded-full bg-[color:var(--color-text-nav)] transition-all",
                  mobileOpen && "-translate-y-2 -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100dvh-var(--navbar-height))] overflow-y-auto overscroll-contain border-t border-black/[0.06] bg-white/95 backdrop-blur-xl xl:hidden">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                if (item.key === "vote") {
                  return (
                    <VoteNavMenu
                      key="vote"
                      layout="drawer"
                      label={t.nav.vote}
                      open={mobileSubmenu === "vote"}
                      onOpenChange={(next) => setMobileSubmenu(next ? "vote" : null)}
                      onNavigate={closeMobileNav}
                      className="w-full"
                    />
                  );
                }
                if (item.key === "monitor") {
                  return (
                    <MonitorNavMenu
                      key="monitor"
                      layout="drawer"
                      label={t.nav.monitor}
                      open={mobileSubmenu === "monitor"}
                      onOpenChange={(next) => setMobileSubmenu(next ? "monitor" : null)}
                      onNavigate={closeMobileNav}
                      className="w-full"
                    />
                  );
                }
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === "/") {
                        handleHomeNavClick(e);
                        return;
                      }
                      closeMobileNav();
                    }}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-[12px] px-3 font-sans text-[0.95rem] font-light tracking-wide text-[color:var(--color-text-nav)] transition-colors hover:bg-primary-50 hover:text-primary",
                      active && "bg-primary-50 text-primary",
                    )}
                  >
                    <i className={cn("bi", item.icon, "text-[1.2rem]")} />
                    <span>{t.nav[item.key]}</span>
                  </Link>
                );
              })}
              {isHydrated && isAuthenticated && (
                <div className="mt-2 border-t border-border-default/60 pt-2">
                  <UserMenu
                    layout="drawer"
                    logoutLabel={t.nav.logout}
                    open={mobileSubmenu === "profile"}
                    onOpenChange={(next) => setMobileSubmenu(next ? "profile" : null)}
                    onNavigate={closeMobileNav}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-border-default/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {!isHydrated ? (
                  <div className="h-10 w-28" aria-hidden />
                ) : !isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="rounded-full border border-primary/40 px-4 py-2 font-sans text-sm font-normal tracking-wide text-primary"
                    >
                      {t.nav.login}
                    </button>
                    <button
                      type="button"
                      onClick={handleRegisterClick}
                      className="btn-brand rounded-full px-4 py-2 font-sans text-sm font-normal tracking-wide"
                    >
                      {t.nav.register}
                    </button>
                  </>
                ) : null}
              </div>
              <LanguageSwitcher label={t.nav.languages} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
