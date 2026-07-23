"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Container } from "@/shared/ui";

const ROTATING = ["от хората", "за хората", "с мисъл за града"];

/** "Какво е SmolyanVote?" + rotating tagline — click scrolls to motivation (v1). */
export function TitleSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ROTATING.length), 3000);
    return () => clearInterval(id);
  }, []);

  function scrollToMotivation() {
    document.getElementById("motivation-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="bg-[#f8f9fa] pb-2 pt-14 md:pb-4 md:pt-16">
      <Container className="text-center">
        <button
          type="button"
          onClick={scrollToMotivation}
          className="mx-auto block w-full max-w-3xl rounded-[20px] px-4 py-4 transition-colors duration-300 hover:bg-[rgba(25,134,28,0.04)]"
        >
          <h2 className="font-display text-gradient-brand text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-[-0.03em]">
            Какво е SmolyanVote?
          </h2>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 font-sans text-[clamp(1rem,2.2vw,1.25rem)] font-light tracking-wide text-[color:var(--color-text-secondary)]">
            <span>Гражданска платформа, създадена</span>
            <span className="relative inline-flex h-[1.6em] min-w-[12ch] items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING[index]}
                  initial={{ opacity: 0, filter: "blur(6px)", y: 8 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
                  transition={{ duration: 0.5 }}
                  className="text-gradient-brand font-medium"
                >
                  {ROTATING[index]}
                </motion.span>
              </AnimatePresence>
            </span>
          </p>
        </button>
      </Container>
    </section>
  );
}
