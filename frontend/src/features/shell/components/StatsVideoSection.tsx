"use client";

import { useEffect, useRef, useState } from "react";
import { Container, ErrorState, Skeleton } from "@/shared/ui";
import { useHomeStats, type HomeStats } from "../hooks/useHomeStats";

const MUX_PLAYBACK_ID = "NEMsgbV9d7wxN9I84A4BGN400BkSluX3VRvkRbjQgl014";

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function useCountUp(target: number, durationMs = 2000, delayMs = 0) {
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
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, durationMs, delayMs]);

  return { value, ref };
}

function StatItem({ title, target, delay }: { title: string; target: number; delay: number }) {
  const { value, ref } = useCountUp(target, 2000, delay);
  return (
    <div ref={ref} className="text-center">
      <h2 className="font-serif text-[clamp(1rem,2vw,1.25rem)] font-semibold text-[#1a202c]">{title}</h2>
      <span className="text-gradient-brand mt-1 block text-[clamp(2rem,4.5vw,2.75rem)] font-extrabold">
        {value}
      </span>
    </div>
  );
}

function StatsColumn({ stats }: { stats: HomeStats }) {
  return (
    <div className="flex flex-col justify-center gap-6 rounded-[16px] bg-white/70 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] backdrop-blur-sm md:gap-8 md:p-8">
      <StatItem title="Потребители" target={stats.usersCount} delay={0} />
      <StatItem title="Опростен вид събития" target={stats.simpleEventsCount} delay={200} />
      <StatItem title="Референдуми" target={stats.referendumsCount} delay={400} />
      <StatItem title="Мулти Анкети" target={stats.multiPollsCount} delay={600} />
    </div>
  );
}

/** Mux promo + vertical stats column (v1 video-stats-wrapper ~60/40). */
export function StatsVideoSection() {
  const { data, isPending, isError, refetch } = useHomeStats();

  return (
    <section className="relative z-[1] -mt-8 bg-[#f8f9fa] py-12 md:py-16">
      <Container>
        <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center">
          <div className="w-full lg:w-[60%]">
            <div
              className="overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(25,134,28,0.12)]"
              style={{ boxShadow: "0 0 0 1px rgba(76,175,80,0.2), 0 12px 40px rgba(25,134,28,0.12)" }}
            >
              <div className="relative aspect-video w-full">
                <iframe
                  src={`https://player.mux.com/${MUX_PLAYBACK_ID}?metadata-video-title=SmolyanVote_promo1`}
                  title="SmolyanVote промо"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[40%]">
            {isPending && (
              <div className="flex flex-col gap-6 rounded-[16px] bg-white/70 p-8">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                ))}
              </div>
            )}
            {isError && (
              <ErrorState
                title="Статистиките не могат да се зареждат"
                description="Опитайте отново след малко."
                onRetry={() => refetch()}
              />
            )}
            {data && <StatsColumn stats={data} />}
          </div>
        </div>
      </Container>
    </section>
  );
}
