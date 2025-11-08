/**
 * Motion utilities and variants for Framer Motion animations
 * Respects prefers-reduced-motion
 */

import { Variants } from 'framer-motion';

// Motion tokens
export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
};

export const easings = {
  standard: [0.2, 0.8, 0.2, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
};

export const spring = {
  stiffness: 220,
  damping: 26,
  mass: 0.8,
};

// Common variants
export const fadeInUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.base,
      delay,
      ease: easings.entrance as any,
    },
  },
});

export const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.base,
      delay,
      ease: easings.entrance as any,
    },
  },
});

export const slideIn = (direction: 'up' | 'down' | 'left' | 'right' = 'up', delay = 0): Variants => {
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return {
    hidden: { opacity: 0, ...directions[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: durations.base,
        delay,
        ease: easings.entrance as any,
      },
    },
  };
};

export const staggerContainer = (staggerChildren = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren: 0.1,
    },
  },
});

// Hover effects
export const hoverLift = {
  whileHover: { y: -2, scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', ...spring },
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', ...spring },
};

// Shake animation for errors
export const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 },
};

// Count-up animation config
export const countUpConfig = {
  duration: 2,
  delay: 0.5,
  useEasing: true,
  easingFn: (t: number) => t * (2 - t), // easeOutQuad
};
