import confetti from 'canvas-confetti';
import { prefersReducedMotion } from './reducedMotion';

/** A small burst for a daily-log celebration. No-ops under reduced motion. */
export function celebrateBurst(): void {
  if (prefersReducedMotion()) return;
  void confetti({
    particleCount: 60,
    spread: 65,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: ['#8b5cf6', '#22d3c9', '#f5a524', '#ef5da8'],
  });
}

/** A bigger cannon for the Day 7 finale — the one biggest moment in the app. */
export function finaleBurst(): void {
  if (prefersReducedMotion()) return;
  const colors = ['#8b5cf6', '#22d3c9', '#f5a524', '#ef5da8', '#ffcc4d'];
  void confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.3 }, colors });
  void confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors });
  void confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors });
}
