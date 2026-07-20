"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Full-bleed hero — left-aligned green typography.
 *
 * Нагласяне нагоре/надолу (px): отрицателно = нагоре, положително = надолу.
 * Пипаш само трите стойности по-долу.
 */
const TITLE_NUDGE_Y = -70; // заглавие „Гласът на Смолян“
const SUBTITLE_NUDGE_Y = -120; // подзаглавие
const BUTTON_NUDGE_Y = -90; // бутон „Участвай сега“

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      <Image
        src="/images/web/hero3.jpg"
        alt="Смолян"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "center top" }}
      />
      {/* v1 light wash — not dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 45%, rgba(76,175,80,0.12) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col px-4 md:px-8 lg:ml-[8%] lg:mr-auto lg:max-w-[55%]">
        <motion.h1
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="text-gradient-brand text-[clamp(2.6rem,6.5vw,4.5rem)] font-medium leading-none tracking-[-0.02em]"
          style={{
            filter: "drop-shadow(0 0 18px rgba(76,175,80,0.35))",
            position: "relative",
            top: TITLE_NUDGE_Y,
          }}
        >
          Гласът на Смолян
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="relative text-[clamp(1.05rem,2.4vw,1.45rem)] font-light leading-none text-[#5a6c7d]"
          style={{
            marginTop: "calc(85vh * 255 / 2000 - 1.35rem)",
            top: SUBTITLE_NUDGE_Y,
          }}
        >
          Вашият глас · Вашият град · Вашето мнение
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative"
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
        </motion.div>
      </div>
    </section>
  );
}
