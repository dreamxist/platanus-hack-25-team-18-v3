import type { Transition, Variants } from "framer-motion";

// ============================================================================
// SPRING PHYSICS CONFIGURATIONS
// ============================================================================

export const spring = {
  // Smooth and responsive - for most UI interactions
  smooth: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },

  // Bouncy and playful - for success states and celebrations
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 20,
  },

  // Gentle and soft - for subtle movements
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
  },

  // Snappy and quick - for immediate feedback
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
  },

  // Elastic - for swipe cards
  elastic: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 0.8,
  },
} as const;

// ============================================================================
// EASING CONFIGURATIONS
// ============================================================================

export const easing = {
  smooth: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// ============================================================================
// DURATION CONFIGURATIONS
// ============================================================================

export const duration = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: spring.smooth,
  },
};

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.smooth,
  },
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.smooth,
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring.bouncy,
  },
};

export const slideInFromBottom: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.smooth,
  },
};

export const slideInFromRight: Variants = {
  hidden: {
    x: 100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: spring.smooth,
  },
};

export const slideInFromLeft: Variants = {
  hidden: {
    x: -100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: spring.smooth,
  },
};

// ============================================================================
// STAGGER CONFIGURATIONS
// ============================================================================

export const staggerChildren = {
  fast: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },
  normal: {
    staggerChildren: 0.1,
    delayChildren: 0.2,
  },
  slow: {
    staggerChildren: 0.15,
    delayChildren: 0.3,
  },
} as const;

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      ...staggerChildren.normal,
    },
  },
};

// ============================================================================
// INTERACTION VARIANTS
// ============================================================================

export const buttonPress = {
  scale: 0.95,
  transition: spring.snappy,
};

export const buttonHover = {
  scale: 1.05,
  transition: spring.smooth,
};

export const cardHover = {
  y: -4,
  scale: 1.02,
  transition: spring.gentle,
};

// ============================================================================
// GESTURE CONFIGURATIONS
// ============================================================================

export const swipeConfig = {
  threshold: 100, // pixels needed to trigger swipe
  velocityThreshold: 500, // velocity needed for quick swipe
  rotation: 20, // max rotation in degrees
  transition: spring.elastic,
};

// ============================================================================
// PAGE TRANSITION VARIANTS
// ============================================================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: spring.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: spring.smooth,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get transition based on user preference
 */
export const getTransition = (transition: Transition): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0.01, type: "tween" };
  }
  return transition;
};

/**
 * Get spring config based on user preference
 */
export const getSpring = (springConfig: typeof spring[keyof typeof spring]) => {
  if (prefersReducedMotion()) {
    return { duration: 0.01, type: "tween" as const };
  }
  return springConfig;
};

/**
 * Create stagger container variant
 */
export const createStaggerContainer = (
  staggerDelay: number = 0.1,
  delayChildren: number = 0
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});
