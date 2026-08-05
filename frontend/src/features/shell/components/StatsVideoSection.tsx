"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type MuxPlayerElement from "@mux/mux-player";
import { Container, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { hapticTap } from "@/shared/lib/haptic";
import { useHomeStats, type HomeStats } from "../hooks/useHomeStats";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

const MUX_PLAYBACK_ID = "NEMsgbV9d7wxN9I84A4BGN400BkSluX3VRvkRbjQgl014";
const PROMO_THUMBNAIL = "/images/web/promo-thumbnail.png";

const STAT_META = [
  {
    key: "usersCount" as const,
    title: "Потребители",
    detail: "Активни граждани в платформата",
    icon: "bi-people",
  },
  {
    key: "eventsCount" as const,
    title: "Събития",
    detail: "Всички гласувания, референдуми и анкети",
    icon: "bi-calendar2-check",
  },
  {
    key: "publicationsCount" as const,
    title: "Публикации",
    detail: "Споделени новини и граждански истории",
    icon: "bi-chat-square-text",
  },
  {
    key: "signalsCount" as const,
    title: "Граждански сигнали",
    detail: "Подадени проблеми върху картата",
    icon: "bi-geo-alt",
  },
] as const;

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function useCountUp(target: number, durationMs = 1800, delayMs = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1);
            setValue(Math.round(target * easeOutQuart(progress)));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, delayMs);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, durationMs, delayMs]);

  return { value, ref };
}

function StatCard({
  title,
  detail,
  icon,
  target,
  delay,
}: {
  title: string;
  detail: string;
  icon: string;
  target: number;
  delay: number;
}) {
  const { value, ref } = useCountUp(target, 1800, delay);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px]",
        "border border-black/[0.05] bg-white/80 px-5 py-5 shadow-[0_10px_32px_-18px_rgba(15,23,42,0.18)]",
        "backdrop-blur-md sm:px-6 sm:py-6",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent opacity-80"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary-50 text-primary ring-1 ring-primary/10">
          <i className={cn("bi text-[1.15rem]", icon)} />
        </span>
        <span className="text-gradient-brand font-display text-[clamp(1.9rem,3.2vw,2.55rem)] font-semibold tracking-[-0.03em] tabular-nums leading-none">
          {value}
        </span>
      </div>

      <h3 className="font-sans text-[0.95rem] font-medium tracking-wide text-[color:var(--color-text-heading)]">
        {title}
      </h3>
      <p className="mt-1.5 font-sans text-[0.78rem] font-light leading-snug tracking-wide text-[color:var(--color-text-secondary)]">
        {detail}
      </p>
    </div>
  );
}

function StatsRow({ stats }: { stats: HomeStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {STAT_META.map((item, i) => (
        <StatCard
          key={item.key}
          title={item.title}
          detail={item.detail}
          icon={item.icon}
          target={stats[item.key]}
          delay={i * 100}
        />
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="rounded-[22px] border border-black/[0.05] bg-white/80 px-5 py-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-[14px]" />
            <Skeleton className="h-8 w-14" />
          </div>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

function PromoVideo() {
  const [started, setStarted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const playerRef = useRef<MuxPlayerElement | null>(null);

  function startPlayback() {
    hapticTap();
    setStarted(true);
  }

  useEffect(() => {
    if (!started || loadError) return;
    const player = playerRef.current;
    if (!player) return;
    void player.play().catch(() => {
      player.muted = true;
      void player.play().then(() => {
        player.muted = false;
      });
    });
  }, [started, loadError]);

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-[#0b1220] shadow-[0_24px_60px_-28px_rgba(25,134,28,0.4)] ring-1 ring-black/[0.06]">
      <div className="relative aspect-video w-full">
        {started && !loadError && (
          <MuxPlayer
            ref={playerRef}
            playbackId={MUX_PLAYBACK_ID}
            metadataVideoTitle="SmolyanVote промо"
            streamType="on-demand"
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full"
            style={{ width: "100%", height: "100%", aspectRatio: "16 / 9" }}
            onError={() => setLoadError(true)}
          />
        )}

        {(!started || loadError) && (
          <button
            type="button"
            onClick={startPlayback}
            aria-label="Пусни промо видеото"
            className="group absolute inset-0 z-10 cursor-pointer"
          >
            <Image
              src={PROMO_THUMBNAIL}
              alt="SmolyanVote промо"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-center"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/5"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition-transform duration-300 group-hover:scale-105 sm:h-[72px] sm:w-[72px]">
                <i className="bi bi-play-fill translate-x-[2px] text-[2.1rem] sm:text-[2.35rem]" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[24px] ring-1 ring-inset ring-white/10"
      />
    </div>
  );
}

/** Stats row under the title, then full-width promo video. */
export function StatsVideoSection() {
  const { data, isPending, isError, refetch } = useHomeStats();

  return (
    <section className="relative z-[1] bg-[#f8f9fa] pb-14 pt-4 md:pb-20 md:pt-6">
      <Container>
        <div className="flex flex-col gap-8 md:gap-10">
          <div>
            {isPending && <StatsSkeleton />}
            {isError && (
              <ErrorState
                title="Статистиките не могат да се зареждат"
                description="Опитайте отново след малко."
                onRetry={() => refetch()}
              />
            )}
            {data && <StatsRow stats={data} />}
          </div>

          <PromoVideo />
        </div>
      </Container>
    </section>
  );
}
