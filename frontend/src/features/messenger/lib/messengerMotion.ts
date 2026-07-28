import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion presets for the desktop messenger. Only `transform` and
 * `opacity` are animated. `prefers-reduced-motion` is already neutralised
 * globally in globals.css, so springs degrade to instant there.
 */

export const springWindow: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 };
export const springDock: Transition = { type: "spring", stiffness: 520, damping: 34, mass: 0.7 };
export const springReaction: Transition = { type: "spring", stiffness: 600, damping: 18 };

export const easeOutQuart = [0.25, 1, 0.5, 1] as const;
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.24, ease: easeOutExpo } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.16, ease: easeOutQuart } },
};

export const bubbleVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeOutQuart } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const dockBubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, x: 12 },
  visible: { opacity: 1, scale: 1, x: 0, transition: springDock },
  exit: { opacity: 0, scale: 0.6, x: 12, transition: { duration: 0.14, ease: easeOutQuart } },
};
