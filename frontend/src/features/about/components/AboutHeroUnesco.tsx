"use client";

import Image from "next/image";
import { ABOUT_PHILOSOPHY_MANIFESTO } from "../data/aboutPhilosophyContent";
import "./about-philosophy.css";

const PANORAMA = "/images/web/about-smolyan-panorama.png";
const LOGO = "/images/logoNew.png";

/** Philosophy hero — continuous text; each block wraps beside then under the floated photo. */
export function AboutHeroUnesco() {
  const { tagline, movement, sections, bridge } = ABOUT_PHILOSOPHY_MANIFESTO;

  return (
    <header className="about-hero-premium relative overflow-hidden">
      <div className="about-hero-premium__bg" aria-hidden />

      <div className="relative mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="about-hero-premium__head">
          <p className="about-hero-premium__kicker">
            <span className="about-hero-premium__badge">Философия</span>
            <span>SmolyanVote</span>
          </p>

          <h1 className="about-hero-premium__title text-gradient-brand font-display mt-3 text-[clamp(1.85rem,4.2vw,3.15rem)] font-bold leading-[1.02] tracking-[-0.04em]">
            Защо SmolyanVote?
          </h1>

          <p className="about-hero-premium__lead mt-2 font-display text-[clamp(1.05rem,1.5vw,1.25rem)] font-light leading-snug tracking-[-0.015em] text-[color:var(--color-text-secondary)]">
            Създадено от хората. За хората. С мисъл за града.
          </p>
        </div>

        <div className="about-hero-premium__flow mt-6">
          <figure className="about-hero-premium__figure">
            <div className="about-hero-premium__glow" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PANORAMA}
              alt="Панорама на Смолян"
              width={1024}
              height={397}
              decoding="async"
              fetchPriority="high"
              className="about-hero-premium__photo"
            />
            <div className="about-hero-premium__frame-shine" aria-hidden />
            <Image
              src={LOGO}
              alt="SmolyanVote"
              width={96}
              height={96}
              priority
              unoptimized
              className="about-hero-premium__logo h-auto w-[clamp(56px,8vw,80px)]"
            />
          </figure>

          <p className="about-hero-premium__tagline about-hero-premium__flow-block font-display text-[clamp(1.125rem,1.8vw,1.5rem)] font-semibold leading-snug tracking-[-0.02em] text-[color:var(--color-primary-800)]">
            {tagline}
          </p>

          {movement.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="about-hero-premium__flow-block about-hero-premium__body about-hero-premium__body--lead"
            >
              {paragraph}
            </p>
          ))}

          {sections.map((section) => (
            <section key={section.id} className="about-hero-premium__chapter">
              <h2 className="about-hero-premium__flow-block about-hero-premium__chapter-title font-display">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="about-hero-premium__flow-block about-hero-premium__body">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {bridge.map((paragraph, i) => (
            <p
              key={paragraph.slice(0, 32)}
              className={[
                "about-hero-premium__flow-block about-hero-premium__body",
                i === bridge.length - 1 && "about-hero-premium__body--emphasis",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {paragraph}
            </p>
          ))}
        </div>

        <footer className="about-hero-premium__foot clear-both mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-primary/10 pt-5">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            От идеи до институции · От глас до промяна
          </p>
          <a href="#about-sections" className="about-hero-premium__cta">
            Към секциите
            <i className="bi bi-arrow-down text-xs" aria-hidden />
          </a>
        </footer>
      </div>
    </header>
  );
}
