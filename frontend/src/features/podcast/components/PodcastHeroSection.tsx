"use client";

import Image from "next/image";
import { PodcastSubscribeButton } from "./PodcastSubscribeButton";
import { UploadEpisodeButton } from "./UploadEpisodeButton";

interface PodcastHeroSectionProps {
  episodeCount: number;
  totalListens: number;
}

export function PodcastHeroSection({ episodeCount, totalListens }: PodcastHeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.65)]">
      <div className="absolute inset-0">
        <Image
          src="/images/web/podcast-studio-hero.png"
          alt="SmolyanVote студио"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      </div>

      <div className="relative flex flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-white/85" />
            SmolyanVote Studio
          </div>
          <h1 className="font-display text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.02em]">
            <span className="block !text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.95)] [text-shadow:0_2px_4px_rgba(0,0,0,0.85),0_0_1px_rgba(0,0,0,1)]">
            <i className="bi bi-mic-fill" />
            </span>
            <span className="mt-1 block bg-gradient-to-r from-white via-white to-[#e8d5b5] bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)]">
              Подкаст
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-white/78">
            Разговори, истории, идеи, коментари, обществени проблеми, ...
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-[16px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/55">Епизоди</p>
              <p className="font-display text-2xl font-semibold text-white">{episodeCount}</p>
            </div>
            <div className="rounded-[16px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/55">Прослушвания</p>
              <p className="font-display text-2xl font-semibold text-white">
                {totalListens.toLocaleString("bg-BG")}
              </p>
            </div>
            <div className="rounded-[16px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/55">Качество</p>
              <p className="font-display text-2xl font-semibold text-white">HQs</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <UploadEpisodeButton className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
            <PodcastSubscribeButton className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
          </div>
          <p className="max-w-xs text-[0.78rem] leading-relaxed text-white/60 lg:text-right">
            Абонирай се за известие при всеки нов епизод директно в пощата си.
          </p>
        </div>
      </div>
    </section>
  );
}
