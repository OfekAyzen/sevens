import type { Transition, Variants } from 'framer-motion';

/**
 * The motion system.
 *
 * Motion confirms that something was recorded. Springs rather than eased
 * curves, because a spring settles and a curve stops, and settling reads as
 * physical.
 *
 * Design Revision — 2026-08-27 (see docs/PRODUCT-SPEC.md): a log submission now
 * gets a celebration (`celebrateVariants`, plus a confetti burst in
 * `src/ui/confetti.ts`) — a deliberate, explicitly-approved reversal of the
 * original "no celebration on a daily log" rule. The Day 7 reveal
 * (`revealVariants`) stays the single biggest moment in the app; the daily
 * celebration is intentionally smaller than it.
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

/** The daily-log celebration. Bouncier than `spring`, but deliberately smaller
 * in scale than `revealVariants` so Day 7 still lands as the biggest moment. */
export const celebrateVariants: Variants = {
  initial: { opacity: 0, scale: 0.7, rotate: -4 },
  enter: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 360, damping: 14, mass: 0.8 },
  },
};

/** Entrance for the streak / catch-up badges. */
export const badgePop: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  enter: { opacity: 1, scale: 1, transition: springSnap },
};

/** A slow, gentle loop for the streak flame — alive without being distracting. */
export const flamePulse = {
  animate: { scale: [1, 1.15, 1] as number[] },
  transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } as Transition,
};

/** Shared transition for leaderboard rows reordering via `layout`. */
export const reorderTransition: Transition = { type: 'spring', stiffness: 300, damping: 30 };
