"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ParticlesBackground, Container } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

interface Supporter {
  name: string;
  lines: string[];
}

const SUPPORTERS: Supporter[] = [
  {
    name: "Dr. Michael Thompson",
    lines: ["Senior Policy Advisor", "Geneva, Switzerland", "Специалист по електронна демокрация"],
  },
  {
    name: "Ing. Stefan Müller",
    lines: ["IT Consultant", "Berlin, Germany", "Създател на платформи за гражданско участие"],
  },
  {
    name: "Андрей Цанов, MBA",
    lines: ["Изпълнителен директор", "Международен консултинг, Лондон", "Специалист по управление"],
  },
  {
    name: "Георги Стоянов",
    lines: ["Собственик на ресторантска верига", "Член на Националната асоциация на ресторантьорите"],
  },
  {
    name: "Андрей Цанов",
    lines: ["Изпълнителен директор на търговска компания", "Член на Ротари клуб"],
  },
];

/** Slightly smaller than v1 (250×360) so the orbit reads wider. */
const CARD_W = 210;
const CARD_H = 315;
const IMG_H = 165;
const STAGE_H = CARD_H + 80;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function useCarouselRadii(enabled: boolean) {
  const [radii, setRadii] = useState({ x: 560, z: 260 });

  useEffect(() => {
    if (!enabled) return;
    function update() {
      const w = window.innerWidth;
      if (w <= 640) {
        setRadii({ x: 200, z: 120 });
      } else if (w <= 900) {
        setRadii({ x: 360, z: 180 });
      } else {
        setRadii({ x: 560, z: 260 });
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [enabled]);

  return radii;
}

function SupporterCard({
  supporter,
  active,
  style,
}: {
  supporter: Supporter;
  active: boolean;
  style?: CSSProperties;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[18px] border bg-gradient-to-b from-white via-white to-primary-50/40",
        "shadow-[0_10px_30px_rgba(25,134,28,0.1),0_4px_12px_rgba(0,0,0,0.06)]",
        "transition-[box-shadow,border-color] duration-300",
        active
          ? "border-primary/25 shadow-[var(--shadow-promo)] ring-1 ring-primary/20"
          : "border-white/90",
      )}
      style={style}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] bg-[image:var(--gradient-primary)] transition-opacity duration-300",
          active ? "opacity-100" : "opacity-50",
        )}
      />

      <div
        className="relative mx-3 mt-3 overflow-hidden rounded-[14px] ring-1 ring-black/[0.06]"
        style={{ height: `${IMG_H}px` }}
      >
        <Image
          src="/images/web/riple.jpeg"
          alt={supporter.name}
          fill
          sizes={`${CARD_W}px`}
          className={cn(
            "object-cover transition-transform duration-700 ease-out",
            active && "scale-[1.03]",
          )}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
        {active && (
          <span className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        )}
      </div>

      <div className="px-3.5 pb-4 pt-3 text-center">
        <h3 className="font-display truncate text-[13px] font-bold tracking-[-0.01em] text-gradient-brand">
          {supporter.name}
        </h3>
        <div
          className={cn(
            "mx-auto my-2 h-px w-10 bg-gradient-to-r from-transparent via-primary/35 to-transparent transition-all duration-300",
            active && "w-14 via-primary/55",
          )}
        />
        <div className="space-y-0.5">
          {supporter.lines.map((line, idx) => (
            <p
              key={line}
              className={cn(
                idx === 0 &&
                  "text-[9px] font-semibold uppercase tracking-[0.07em] text-primary-700/85",
                idx === 1 && "text-[9px] text-[color:var(--color-text-muted)]",
                idx === 2 &&
                  "text-[10px] leading-snug text-[color:var(--color-text-secondary)]",
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {active && (
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
      )}
    </article>
  );
}

/** 3D elliptical support carousel + green particles. */
export function SupportCarousel() {
  const [mounted, setMounted] = useState(false);
  const [angle, setAngle] = useState(0);
  const { x: radiusX, z: radiusZ } = useCarouselRadii(mounted);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const raf = useRef(0);
  const angleRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      if (!dragging.current) {
        angleRef.current += 0.0015 + velocity.current;
        velocity.current *= 0.94;
        if (Math.abs(velocity.current) < 0.0001) velocity.current = 0;
        setAngle(angleRef.current);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf.current);
    };
  }, [mounted]);

  // Non-passive wheel listener — React's onWheel is passive and blocks preventDefault.
  useEffect(() => {
    if (!mounted) return;
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      angleRef.current += e.deltaY * 0.0015;
      setAngle(angleRef.current);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mounted]);

  const step = (2 * Math.PI) / SUPPORTERS.length;

  return (
    <section className="relative overflow-hidden bg-[#f0f7f1] py-16 md:py-24">
      <ParticlesBackground theme="green" count={70} className="absolute inset-0 opacity-70" />
      <Container className="relative z-10">
        <h2 className="text-gradient-brand text-center text-[clamp(1.5rem,3.5vw,2rem)] font-bold uppercase tracking-[0.18em]">
          Подкрепа
        </h2>
      </Container>

      <div
        ref={stageRef}
        className="relative z-10 mx-auto mt-8 w-full max-w-[1400px] cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ height: `${STAGE_H}px`, perspective: "1300px" }}
        onPointerDown={(e) => {
          if (!mounted) return;
          dragging.current = true;
          lastX.current = e.clientX;
          velocity.current = 0;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const dx = e.clientX - lastX.current;
          lastX.current = e.clientX;
          const delta = dx * 0.003;
          velocity.current = delta;
          angleRef.current += delta;
          setAngle(angleRef.current);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {!mounted ? (
          // SSR + first paint: static front card — avoids float/style hydration mismatch
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <SupporterCard
              supporter={SUPPORTERS[0]}
              active
              style={{ width: `${CARD_W}px`, height: `${CARD_H}px` }}
            />
          </div>
        ) : (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              transformStyle: "preserve-3d",
            }}
          >
            {SUPPORTERS.map((s, i) => {
              const a = angle + i * step;
              const x = round2(Math.cos(a) * radiusX);
              const z = round2(Math.sin(a) * radiusZ);
              const depth = (z + radiusZ) / (2 * radiusZ);
              const scale = round2(0.68 + depth * 0.32);
              const opacity = round2(0.38 + depth * 0.62);
              const active = z >= radiusZ * 0.55;

              return (
                <SupporterCard
                  key={s.name}
                  supporter={s}
                  active={active}
                  style={{
                    position: "absolute",
                    width: `${CARD_W}px`,
                    height: `${CARD_H}px`,
                    marginLeft: `${-CARD_W / 2}px`,
                    marginTop: `${-CARD_H / 2}px`,
                    left: "50%",
                    top: "50%",
                    transform: `translate3d(${x}px, 0px, ${z}px) scale(${scale})`,
                    opacity,
                    zIndex: Math.round(z * 100),
                    backfaceVisibility: "hidden",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
