import { TIMING, EASING } from './animationConfig';

/**
 * Reusable animation variants за Framer Motion
 * Използвай ги в компонентите: variants={fadeInUp}
 */

// ========== FADE ANIMATIONS ==========

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: TIMING.normal, ease: EASING.easeOut }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: TIMING.normal, ease: EASING.easeOut }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: TIMING.normal, ease: EASING.easeOut }
};

// ========== SCALE ANIMATIONS ==========

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: TIMING.fast, ease: EASING.easeOut }
};

export const scalePop = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: EASING.springBouncy
  },
  exit: { opacity: 0, scale: 0.8 }
};

// ========== SLIDE ANIMATIONS ==========

export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { duration: TIMING.normal, ease: EASING.easeOut }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: TIMING.normal, ease: EASING.easeOut }
};

export const slideUpSpring = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: EASING.spring
  },
  exit: { opacity: 0, y: 50 }
};

// ========== STAGGER CONTAINER ==========

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerFast = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// ========== MESSAGE SPECIFIC ==========

export const messagePopIn = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: EASING.springBouncy
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: -50,
    transition: { duration: TIMING.fast }
  }
};

// ========== TYPING DOTS ==========

export const typingDot = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// ========== HOVER EFFECTS ==========

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: TIMING.fast }
  },
  tap: { scale: 0.98 }
};
