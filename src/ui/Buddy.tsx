import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { spring } from './motion';

export type BuddyState = 'idle' | 'happy' | 'celebrate' | 'waiting';

/**
 * The one drawn character in the app — a round, friendly blob with eyes and a
 * mouth, entirely inline SVG (no image assets anywhere in this codebase).
 * Picks up the viewer's own person-color as its body color, so it reads as
 * "yours" without needing a separate design per person.
 */
const POSE: Record<BuddyState, { mouth: string; arm: number; brow: number }> = {
  idle: { mouth: 'M 42 74 Q 60 82 78 74', arm: 8, brow: 0 },
  happy: { mouth: 'M 38 70 Q 60 92 82 70', arm: 24, brow: -2 },
  celebrate: { mouth: 'M 36 66 Q 60 98 84 66', arm: 60, brow: -5 },
  waiting: { mouth: 'M 46 76 Q 60 78 74 76', arm: -6, brow: 4 },
};

export function Buddy({
  state = 'idle',
  hue = 'var(--accent)',
  size = 96,
  testId,
}: {
  state?: BuddyState;
  hue?: string;
  size?: number;
  testId?: string;
}) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setBlink(true);
      timeout = setTimeout(() => setBlink(false), 120);
    }, 2800 + Math.random() * 1800);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const pose = POSE[state];
  const celebrating = state === 'celebrate';

  return (
    <motion.div
      data-testid={testId}
      style={{ width: size, height: size, display: 'inline-block' }}
      animate={
        celebrating
          ? { y: [0, -16, 0, -8, 0], rotate: [0, -6, 6, -3, 0] }
          : { y: [0, -5, 0] }
      }
      transition={
        celebrating
          ? { duration: 0.9, ease: 'easeOut' }
          : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
        <motion.ellipse
          cx="20" cy="72" rx="10" ry="16" fill={hue}
          style={{ transformOrigin: '28px 58px' }}
          animate={{ rotate: pose.arm }}
          transition={spring}
        />
        <motion.ellipse
          cx="100" cy="72" rx="10" ry="16" fill={hue}
          style={{ transformOrigin: '92px 58px' }}
          animate={{ rotate: -pose.arm }}
          transition={spring}
        />
        <circle cx="60" cy="62" r="42" fill={hue} />
        <ellipse cx="60" cy="80" rx="22" ry="14" fill="rgba(255,255,255,0.18)" />

        <motion.g animate={{ y: pose.brow }} transition={spring}>
          <ellipse cx="44" cy="54" rx="8" ry={blink ? 1 : 9} fill="#0b0d12" />
          <ellipse cx="76" cy="54" rx="8" ry={blink ? 1 : 9} fill="#0b0d12" />
          {!blink ? (
            <>
              <circle cx="46.5" cy="51" r="2.4" fill="#fff" />
              <circle cx="78.5" cy="51" r="2.4" fill="#fff" />
            </>
          ) : null}
        </motion.g>

        <path
          d={pose.mouth}
          stroke="#0b0d12" strokeWidth="4" strokeLinecap="round" fill="none"
        />

        {celebrating
          ? [0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2;
              return (
                <motion.path
                  key={i}
                  d="M60,25 L61.8,28.2 L65,30 L61.8,31.8 L60,35 L58.2,31.8 L55,30 L58.2,28.2 Z"
                  fill={i % 2 === 0 ? 'var(--rank-gold)' : hue}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.4, 0.6],
                    rotate: [0, 90],
                    x: Math.cos(angle) * 42,
                    y: Math.sin(angle) * 42 - 24,
                  }}
                  transition={{ duration: 0.9, delay: i * 0.05, ease: 'easeOut' }}
                />
              );
            })
          : null}
      </svg>
    </motion.div>
  );
}
