"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { hapticTap } from "@/shared/lib/haptic";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { getShellMessages, type Language } from "@/lib/i18n/locales";
import { NAV_ITEMS } from "../data/navItems";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { VoteNavMenu } from "./VoteNavMenu";

interface NavbarProps {
  notificationSlot?: ReactNode;
  lang: Language;
}

/** Fixed glass navbar — visual parity with v1 `navbar-glassmorphism`. */
export function Navbar({ notificationSlot, lang }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = getShellMessages(lang);
  const { isAuthenticated, isHydrated } = useAuth();
  const openAuth = useLoginGateStore((s) => s.open);

  function handleLoginClick() {
    hapticTap();
    setMobileOpen(false);
    openAuth("login");
  }

  function handleRegisterClick() {
    hapticTap();
    setMobileOpen(false);
    openAuth("register");
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-[1030] w-full">
      <div
        className="flex w-full items-center justify-center border-b border-white/20 px-3 py-2.5 shadow-[0_2px_15px_rgba(0,0,0,0.08)] backdrop-blur-[5px] sm:px-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,249,250,0.95) 0%, rgba(248,249,250,0.85) 40%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,0.3) 100%)",
          minHeight: "var(--navbar-height)",
        }}
      >
        <div className="flex w-full max-w-[1400px] items-center justify-between gap-2">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/images/logoNew.png"
              alt="SmolyanVote"
              width={38}
              height={38}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="bg-gradient-to-r from-[#19861c] to-[#48a24c] bg-clip-text text-[1.15rem] font-bold tracking-tight text-transparent">
              SMOLYANVOTE
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 xl:flex">
            {NAV_ITEMS.map((item) => {
              if (item.key === "vote") {
                return <VoteNavMenu key="vote" label={t.nav.vote} />;
              }
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-2.5 py-2 text-[0.8rem] font-light tracking-[0.3px] text-[color:var(--color-text-nav)] transition-colors hover:text-primary",
                    active && "text-primary",
                  )}
                >
                  <i className={cn("bi", item.icon, "text-[1.05rem]")} />
                  <span>{t.nav[item.key]}</span>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[image:var(--gradient-primary)] transition-all duration-300",
                      active ? "w-[70%]" : "w-0 group-hover:w-[70%]",
                    )}
                  />
                </Link>
              );
            })}

            <LanguageSwitcher className="ml-1" label={t.nav.languages} />
          </div>

          <div className="hidden items-center gap-2 xl:flex">
            {!isHydrated ? (
              <div className="h-10 w-28" aria-hidden />
            ) : isAuthenticated ? (
              <UserMenu logoutLabel={t.nav.logout} />
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="rounded-[8px] px-3.5 py-2 text-[0.85rem] font-medium text-[color:var(--color-text-nav)] transition-colors hover:text-primary"
                >
                  {t.nav.login}
                </button>
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className="btn-brand rounded-[8px] px-4 py-2 text-[0.85rem] font-semibold shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
                >
                  {t.nav.register}
                </button>
              </>
            )}
            {isHydrated ? notificationSlot : <div className="h-10 w-10" aria-hidden />}
          </div>

          <button
            type="button"
            aria-label={t.nav.menu}
            aria-expanded={mobileOpen}
            onClick={() => {
              hapticTap();
              setMobileOpen((v) => !v);
            }}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 xl:hidden"
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

      {mobileOpen && (
        <div className="max-h-[calc(100vh-var(--navbar-height))] overflow-y-auto border-t border-white/20 bg-white/95 px-4 py-3 backdrop-blur-md xl:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              if (item.key === "vote") {
                return (
                  <div key="vote" className="py-1">
                    <VoteNavMenu
                      label={t.nav.vote}
                      onNavigate={() => setMobileOpen(false)}
                      className="w-full [&_button]:w-full [&_button]:justify-start"
                    />
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center gap-3 rounded-[8px] px-3 text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50 hover:text-primary"
                >
                  <i className={cn("bi", item.icon, "text-[1.2rem]")} />
                  <span>{t.nav[item.key]}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border-default/60 pt-3">
            <div className="flex items-center gap-2">
              {!isHydrated ? (
                <div className="h-10 w-28" aria-hidden />
              ) : isAuthenticated ? (
                <UserMenu logoutLabel={t.nav.logout} />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="rounded-[8px] border border-primary/40 px-4 py-2 text-sm font-medium text-primary"
                  >
                    {t.nav.login}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="btn-brand rounded-[8px] px-4 py-2 text-sm font-semibold"
                  >
                    {t.nav.register}
                  </button>
                </>
              )}
              {isHydrated ? notificationSlot : null}
            </div>
            <LanguageSwitcher label={t.nav.languages} />
          </div>
        </div>
      )}
    </nav>
  );
}
