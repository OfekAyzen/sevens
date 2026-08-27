import { motion } from 'framer-motion';

/**
 * A handful of soft, blurred, drifting circles behind screen content — ambient
 * movement so a screen never feels static, even before anything scores or
 * celebrates. Purely decorative: no text, `aria-hidden`, and it respects
 * `prefers-reduced-motion` via the same global CSS rule everything else does
 * (see `src/ui/tokens.css`).
 */
const SHAPES = [
  { hue: 'var(--p1)', size: 170, top: '4%', left: '-8%', dur: 9 },
  { hue: 'var(--p3)', size: 120, top: '58%', left: '82%', dur: 11 },
  { hue: 'var(--p4)', size: 130, top: '80%', left: '-6%', dur: 10 },
];

export function FloatingShapes() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {SHAPES.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.hue,
            opacity: 0.16,
            filter: 'blur(18px)',
            // Promotes each shape to its own compositor layer up front, so the
            // blur is rasterized once and the loop below is a cheap GPU
            // transform each frame rather than a re-blur of moving content.
            willChange: 'transform',
          }}
          animate={{ y: [0, -18, 0, 14, 0], x: [0, 10, 0, -10, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
