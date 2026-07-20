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

/** Smaller cards than v1 (250×360) so the orbit reads wider. */
const CARD_W = 180;
const CARD_H = 270;
const IMG_H = 140;
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
        "overflow-hidden rounded-[14px] border border-black/10 bg-white/95 p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)]",
        active && "shadow-[0_18px_40px_rgba(0,0,0,0.28)] ring-2 ring-primary/25",
      )}
      style={style}
    >
      <div className="relative w-full overflow-hidden rounded-[10px]" style={{ height: `${IMG_H}px` }}>
        <Image
          src="/images/web/riple.jpeg"
          alt={supporter.name}
          fill
          sizes={`${CARD_W}px`}
          className="object-cover"
          draggable={false}
        />
        {active && (
          <span className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        )}
      </div>
      <div className="px-1.5 pt-2.5 text-center">
        <h3 className="text-gradient-brand truncate border-b border-black/10 pb-1.5 text-[13px] font-semibold">
          {supporter.name}
        </h3>
        <p className="mt-1.5 text-[11px] leading-snug text-[#333]">
          {supporter.lines.map((line, idx) => (
            <span key={line}>
              {line}
              {idx < supporter.lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
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
