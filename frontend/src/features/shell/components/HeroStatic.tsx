import Link from "next/link";

/**
 * Server-rendered hero copy — no client JS / hydration on the LCP text path.
 * Layout nudge values mirror {@link HeroEffects} / legacy Hero.tsx.
 */
const TITLE_NUDGE_Y = -70;
const SUBTITLE_NUDGE_Y = -120;
const BUTTON_NUDGE_Y = -90;

export function HeroStatic() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col px-4 md:px-8 lg:ml-[8%] lg:mr-auto lg:max-w-[55%]">
      <h1
        className="sv-hero-title hero-animate-title text-gradient-brand text-[clamp(2.6rem,6.5vw,4.5rem)] font-medium leading-none tracking-[-0.02em]"
        style={{
          filter: "drop-shadow(0 0 18px rgba(76,175,80,0.35))",
          position: "relative",
          top: TITLE_NUDGE_Y,
        }}
      >
        Гласът на Смолян
      </h1>
      <p
        className="hero-animate-subtitle relative text-[clamp(1.05rem,2.4vw,1.45rem)] font-light leading-none text-[#5a6c7d]"
        style={{
          marginTop: "calc(85vh * 255 / 2000 - 1.35rem)",
          top: SUBTITLE_NUDGE_Y,
        }}
      >
        Вашият глас · Вашият град · Вашето мнение
      </p>
      <div
        className="hero-animate-cta relative"
        style={{
          marginTop: "calc(85vh * 255 / 2000 - 3.35rem)",
          top: BUTTON_NUDGE_Y,
        }}
      >
        <Link
          href="/events"
          className="btn-brand group relative inline-flex overflow-hidden rounded-[999px] px-9 py-3.5 text-base font-semibold shadow-[0_8px_24px_rgba(25,134,28,0.35)] transition-transform hover:-translate-y-1"
        >
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden
          />
          Участвай сега
        </Link>
      </div>
    </div>
  );
}
