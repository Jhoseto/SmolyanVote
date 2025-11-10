/**
 * Централна конфигурация за всички анимации
 * Позволява лесна промяна на timing и easing
 */

// ========== TIMING ==========

export const TIMING = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8
};

// ========== EASING ==========

export const EASING = {
  easeOut: [0.25, 1, 0.5, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  springBouncy: { type: "spring", stiffness: 400, damping: 20 },
  springGentle: { type: "spring", stiffness: 200, damping: 25 }
};

// ========== STAGGER ==========

export const STAGGER = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15
};
