"use client";

import { Container } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { AboutSection as AboutSectionData } from "../data/aboutSections";
import { AboutPhilosophyVideo } from "./AboutPhilosophyVideo";

interface AboutSectionProps {
  section: AboutSectionData;
  /** Alternates video/text sides on desktop; mobile always stacks text → video. */
  reverse: boolean;
  /** Subtle stripe background for rhythm between sections. */
  muted?: boolean;
}

export function AboutSection({ section, reverse, muted }: AboutSectionProps) {
  return (
    <section className={cn("py-14 md:py-20", muted && "bg-[#f4f9f5]/80")}>
      <Container>
        <div className="about-section-enter grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className={cn(reverse ? "md:order-2" : "md:order-1")}>
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary-50 text-primary ring-1 ring-primary/10">
              <i className={cn("bi text-xl", section.icon)} aria-hidden />
            </div>
            <h2 className="font-display text-[clamp(1.35rem,2.8vw,2rem)] font-bold leading-snug tracking-[-0.02em] text-[color:var(--color-text-heading)]">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {section.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className={cn(reverse ? "md:order-1" : "md:order-2")}>
            <AboutPhilosophyVideo
              playbackId={section.playbackId}
              videoTitle={section.videoTitle}
              objectPosition={section.objectPosition}
              mediaZoom={section.mediaZoom}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
