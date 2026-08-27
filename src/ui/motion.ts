import type { Transition, Variants } from 'framer-motion';

/**
 * The motion system.
 *
 * One idea: motion here confirms that something was recorded, and nothing more.
 * There is no celebration animation on a daily log — enthusiasm inflation on
 * Day 2 makes Day 7 worth nothing, so the big moment is spent once, on the
 * Day 1-versus-Day 7 reveal.
 *
 * Springs rather than eased curves, because a spring settles and a curve stops,
 * and settling reads as physical.
 */

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };
export const springSoft: Transition = { type: 'spring', stiffness: 220, damping: 28 };
export const springSnap: Transition = { type: 'spring', stiffness: 620, damping: 30 };

/** Screen-level enter/exit. Short, and never a slide that implies going back. */
export const screenVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { ...spring, delay: 0.02 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.14 } },
};

/** Staggered list children, for the group rows and the day strip. */
export const listVariants: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: springSoft },
};

/** A tap that feels like pressing a real thing. */
export const pressable = {
  whileTap: { scale: 0.97 },
  transition: springSnap,
} as const;

/**
 * The one big moment: the Day 7 reveal. Used exactly once, which is what makes
 * it land.
 */
export const revealVariants: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  enter: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 180, damping: 18, mass: 1.1 },
  },
};
