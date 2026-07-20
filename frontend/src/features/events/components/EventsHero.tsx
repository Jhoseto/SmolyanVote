"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ParticlesBackground } from "@/shared/ui";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { cn } from "@/shared/lib/cn";

const CREATE_OPTIONS = [
  {
    href: "/event/new",
    label: "Създай Опростен Вид Събитие",
    icon: "bi-pencil-square",
    reason: "да създадеш събитие",
  },
  {
    href: "/referendum/new",
    label: "Създай Референдум",
    icon: "bi-file-earmark-plus",
    reason: "да създадеш референдум",
  },
  {
    href: "/multipoll/new",
    label: "Създай Анкета с Множествен Избор",
    icon: "bi-list-check",
    reason: "да създадеш анкета",
  },
] as const;

/** Full-bleed events hub hero — glass panels + refined title. */
export function EventsHero() {
  const router = useRouter();
  const requireAuth = useRequireAuth();

  async function handleCreate(option: (typeof CREATE_OPTIONS)[number]) {
    if (!(await requireAuth(option.reason))) return;
    router.push(option.href);
  }

  return (
    <section className="relative flex min-h-[52vh] items-center overflow-hidden md:min-h-[58vh]">
      <Image
        src="/images/web/why.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_-80px] md:object-[center_-180px]"
      />
      <div className="absolute inset-0 bg-black/35" />
      <ParticlesBackground theme="white" count={60} className="absolute inset-0 z-[1]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-16">
        <div className="max-w-2xl rounded-[var(--radius-lg)] border border-white/20 bg-white/10 p-6 shadow-[var(--shadow-lg)] backdrop-blur-md sm:p-8">
          <h1
            className="font-display !text-white text-[clamp(2.4rem,5.5vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em]"
            style={{ color: "#ffffff", textShadow: "0 2px 18px rgba(0,0,0,0.35)" }}
          >
            Събития
          </h1>
          <div className="mt-3 h-1 w-14 rounded-full bg-[image:var(--gradient-primary)]" />
          <p className="mt-3 text-[0.8rem] leading-snug text-white/90 sm:text-[0.85rem] sm:leading-[1.35]">
            <span className="block">
              Открийте или създайте събития, които оформят бъдещето на Смолян.
            </span>
            <span className="block">
              Търсете събития по ключова дума или потребител, за да намерите точно това, което ви
              интересува.
            </span>
            <span className="block">
              Използвайте филтри по категории, местоположение и статус, за да персонализирате
              избора си.
            </span>
            <span className="block">Участвайте активно, като гласувате в референдуми и анкети.</span>
            <span className="block">Създайте свои собствени събития и ангажирайте общността.</span>
            <span className="mt-1.5 block">
              <strong className="text-white">Важно!</strong> Преди да създадете ново събитие,
              проверете дали не съществува вече подобно такова.
            </span>
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-2.5 lg:shrink-0">
          {CREATE_OPTIONS.map((option) => (
            <button
              key={option.href}
              type="button"
              onClick={() => handleCreate(option)}
              className={cn(
                "group flex items-center gap-3 rounded-[var(--radius-md)] border border-white/25",
                "bg-white/15 px-4 py-3 text-left text-white shadow-[var(--shadow-md)] backdrop-blur-md",
                "transition-all hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-[var(--shadow-lg)]",
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[image:var(--gradient-primary)] text-lg text-white shadow-[var(--shadow-sm)]">
                <i className={cn("bi", option.icon)} />
              </span>
              <span className="text-sm font-semibold leading-snug">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
