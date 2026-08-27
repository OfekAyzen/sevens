import { prefersReducedMotion } from './reducedMotion';

/**
 * Tiny synthesized sound effects — a few short oscillator tones, no audio
 * files. Gated behind the same reduced-motion check as confetti, and fails
 * silently if AudioContext isn't available (older WebViews).
 */

let sharedContext: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
  try {
    sharedContext ??= new AudioContext();
    return sharedContext;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, delay = 0, gainPeak = 0.08): void {
  const audio = context();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audio.destination);
  const start = audio.currentTime + delay;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** A short tick — one per scored action popping in on the log screen. */
export function playTick(): void {
  if (prefersReducedMotion()) return;
  tone(880, 0.1);
}

/** A small three-note rise — the daily-log save/celebrate chime. */
export function playCelebrate(): void {
  if (prefersReducedMotion()) return;
  tone(523.25, 0.15);
  tone(659.25, 0.15, 0.09);
  tone(783.99, 0.22, 0.18);
}

/** A quick two-note ping — rank-up / streak-milestone. */
export function playRankUp(): void {
  if (prefersReducedMotion()) return;
  tone(660, 0.1);
  tone(990, 0.16, 0.08);
}
