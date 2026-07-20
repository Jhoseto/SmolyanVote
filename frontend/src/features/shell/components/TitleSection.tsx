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
    <section className="py-14 md:py-20">
      <Container className="text-center">
        <button
          type="button"
          onClick={scrollToMotivation}
          className="mx-auto block w-full max-w-3xl rounded-[16px] px-4 py-6 transition-all duration-300 hover:-translate-y-1 hover:bg-[rgba(25,134,28,0.04)]"
        >
          <h2 className="text-gradient-brand text-[clamp(1.85rem,4.2vw,3.2rem)] font-bold">
            Какво е SmolyanVote?
          </h2>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 text-[clamp(1.1rem,2.5vw,1.4rem)] text-[color:var(--color-text-secondary)]">
            <span>Гражданска платформа, създадена</span>
            <span className="relative inline-flex h-[1.7em] min-w-[12ch] items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING[index]}
                  initial={{ opacity: 0, filter: "blur(6px)", y: 8 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
                  transition={{ duration: 0.5 }}
                  className="text-gradient-brand font-semibold"
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
