import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import {
  CREATE_EVENT_PAGE_COPY,
  type CreateEventType,
} from "../data/createEventPageCopy";

interface CreateEventShellProps {
  type: CreateEventType;
  children: ReactNode;
}

/** Shared create-page chrome: hero image, tips/rules, type switcher + form slot. */
export function CreateEventShell({ type, children }: CreateEventShellProps) {
  const copy = CREATE_EVENT_PAGE_COPY[type];

  return (
    <div className="bg-[#f8f9fa]">
      <Container className="py-8 md:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Info column */}
          <aside className="flex flex-col gap-6 lg:col-span-5 lg:sticky lg:top-[calc(var(--navbar-height)+16px)]">
            {/* Hero */}
            <div className="group relative isolate min-h-[22rem] overflow-hidden rounded-[24px] shadow-[0_24px_56px_-28px_rgba(10,46,12,0.55)] sm:min-h-[24rem]">
              <Image
                src={copy.heroSrc}
                alt={copy.heroAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[center_28%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                priority
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,28,10,0.12)_0%,rgba(8,28,10,0.28)_38%,rgba(6,22,8,0.72)_100%)]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(25,134,28,0.32),transparent_55%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl"
              />

              <div className="relative flex h-full min-h-[22rem] flex-col justify-end p-5 sm:min-h-[24rem] sm:p-6">
                <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 font-sans text-[0.72rem] font-medium tracking-wide text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md sm:left-6 sm:top-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
                  {copy.badge}
                </span>

                <div className="rounded-[18px] border border-white/15 bg-white/[0.1] p-5 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6">
                  <h1 className="!text-white text-balance font-display text-[clamp(1.65rem,3.2vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
                    {copy.title}
                  </h1>
                  <p className="mt-2.5 text-pretty font-sans text-[0.92rem] font-light leading-relaxed tracking-wide text-white/85">
                    {copy.intro}
                  </p>
                  <div
                    aria-hidden
                    className="mt-5 h-px w-14 rounded-full bg-gradient-to-r from-[#7dff87] to-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/[0.05] bg-white/90 p-5 shadow-[0_10px_32px_-18px_rgba(15,23,42,0.14)] backdrop-blur-md sm:p-6">
              <h2 className="font-sans text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary">
                Как работи
              </h2>
              <ul className="mt-4 flex flex-col gap-3.5">
                {copy.howItWorks.map((item) => (
                  <li
                    key={item.title}
                    className="flex gap-3 rounded-[16px] border border-transparent bg-primary-50/40 p-3 transition-colors hover:border-primary/15 hover:bg-primary-50/80"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-primary shadow-[0_6px_16px_-10px_rgba(25,134,28,0.55)] ring-1 ring-primary/12">
                      <i className={cn("bi text-[1.05rem]", item.icon)} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-sans text-[0.92rem] font-semibold text-[color:var(--color-text-heading)]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-pretty font-sans text-[0.8rem] font-light leading-snug text-[color:var(--color-text-secondary)]">
                        {item.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[22px] border border-amber-200/70 bg-gradient-to-br from-amber-50 to-amber-50/60 p-5 sm:p-6">
              <p className="flex items-center gap-2 font-sans text-[0.88rem] font-semibold text-amber-950">
                <i className="bi bi-exclamation-triangle text-[1rem] text-amber-700" />
                Преди да създадете
              </p>
              <p className="mt-2 text-pretty font-sans text-[0.82rem] font-light leading-relaxed text-amber-950/80">
                {copy.beforeCreate}
              </p>
              <Link
                href="/events"
                className="mt-3 inline-flex items-center gap-1.5 font-sans text-[0.82rem] font-semibold text-primary transition-colors hover:text-primary-700"
              >
                Разгледай активните събития
                <i className="bi bi-arrow-right text-[0.85rem]" />
              </Link>
            </div>

            <div className="rounded-[22px] border border-black/[0.05] bg-white/90 p-5 shadow-[0_10px_32px_-18px_rgba(15,23,42,0.1)] backdrop-blur-md sm:p-6">
              <h2 className="font-sans text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary">
                Правила
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {copy.rules.map((rule) => (
                  <li
                    key={rule}
                    className="flex gap-2.5 font-sans text-[0.8rem] font-light leading-snug text-[color:var(--color-text-secondary)]"
                  >
                    <i className="bi bi-check2-circle mt-0.5 shrink-0 text-primary" />
                    <span className="text-pretty">{rule}</span>
                  </li>
                ))}
              </ul>

              <h2 className="mt-5 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary">
                Съвети
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {copy.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-2.5 font-sans text-[0.8rem] font-light leading-snug text-[color:var(--color-text-secondary)]"
                  >
                    <i className="bi bi-lightbulb mt-0.5 shrink-0 text-primary" />
                    <span className="text-pretty">{tip}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/faq#creating"
                className="mt-5 inline-flex items-center gap-1.5 font-sans text-[0.8rem] font-semibold text-primary transition-colors hover:text-primary-700"
              >
                Повече във FAQ
                <i className="bi bi-box-arrow-up-right text-[0.75rem]" />
              </Link>
            </div>

            <div>
              <p className="mb-2 font-sans text-[0.75rem] font-medium uppercase tracking-[0.12em] text-primary">
                Друг тип събитие?
              </p>
              <div className="flex flex-col gap-2">
                {copy.typeSwitcher
                  .filter((item) => item.type !== type)
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group/switch flex items-center justify-between rounded-[16px] border border-black/[0.05] bg-white px-4 py-3 shadow-[0_6px_18px_-14px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary-50/70 hover:shadow-[0_12px_28px_-16px_rgba(25,134,28,0.35)]"
                    >
                      <span className="min-w-0">
                        <span className="block font-sans text-[0.88rem] font-semibold text-[color:var(--color-text-heading)]">
                          {item.label}
                        </span>
                        <span className="block font-sans text-[0.75rem] font-light text-[color:var(--color-text-secondary)]">
                          {item.hint}
                        </span>
                      </span>
                      <i className="bi bi-chevron-right text-[color:var(--color-text-muted)] transition-transform group-hover/switch:translate-x-0.5 group-hover/switch:text-primary" />
                    </Link>
                  ))}
              </div>
            </div>
          </aside>

          {/* Form column */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[24px] border border-black/[0.05] bg-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] sm:p-6 md:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/[0.07] blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-[#48a24c]/10 blur-3xl"
              />

              <div className="relative mb-6 flex flex-col gap-3 border-b border-black/[0.05] pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-primary ring-1 ring-primary/15">
                    <i className="bi bi-pencil-square text-[0.75rem]" />
                    Форма
                  </span>
                  <span className="font-sans text-[0.72rem] font-light text-[color:var(--color-text-muted)]">
                    3 стъпки · около 2 мин
                  </span>
                </div>
                <h2 className="text-gradient-brand text-balance font-display text-[1.35rem] font-semibold tracking-[-0.03em] sm:text-[1.5rem]">
                  Попълнете стъпките по-долу
                </h2>
                <p className="max-w-xl text-pretty rounded-[14px] border border-amber-200/80 bg-amber-50/90 px-3.5 py-2.5 font-sans text-[0.78rem] font-light leading-relaxed text-amber-950/85">
                  <i className="bi bi-lock me-1.5 text-amber-700" />
                  {copy.submitHint}
                </p>
              </div>

              <div className="relative">{children}</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
