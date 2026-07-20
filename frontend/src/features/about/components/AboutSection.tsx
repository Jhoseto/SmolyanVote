"use client";

import MuxPlayer from "@mux/mux-player-react";
import { motion } from "framer-motion";
import { Container } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { AboutSection as AboutSectionData } from "../data/aboutSections";

interface AboutSectionProps {
  section: AboutSectionData;
  /** Alternates video/text sides on desktop; mobile always stacks text → video. */
  reverse: boolean;
}

export function AboutSection({ section, reverse }: AboutSectionProps) {
  return (
    <motion.section
      className="py-14 md:py-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className={cn(reverse ? "md:order-2" : "md:order-1")}>
            <h2 className="flex items-center gap-3 text-[clamp(1.4rem,3vw,1.9rem)] font-bold text-[color:var(--color-text-heading)]">
              <i className={cn("bi text-primary", section.icon)} />
              {section.title}
            </h2>
            <div className="mt-4 space-y-3 text-[color:var(--color-text-secondary)]">
              {section.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className={cn("overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]", reverse ? "md:order-1" : "md:order-2")}>
            <MuxPlayer
              playbackId={section.playbackId}
              metadataVideoTitle={section.videoTitle}
              autoPlay="muted"
              muted
              loop
              playsInline
              nohotkeys
              streamType="on-demand"
              style={{ aspectRatio: "16/9", width: "100%" }}
            />
          </div>
        </div>
      </Container>
    </motion.section>
  );
}
