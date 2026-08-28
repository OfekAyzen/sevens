import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { FloatingShapes } from './FloatingShapes';
import {
  badgePop,
  flamePulse,
  itemVariants,
  listVariants,
  pressable,
  screenVariants,
  spring,
} from './motion';
import './components.css';

/**
 * `accent` sets this screen's dominant color identity (e.g. `'var(--p2)'`) —
 * Design Revision 2026-08-27, round 3: every screen used to default to
 * `--accent`, which read as one hue everywhere. Omit it to keep that default.
 *
 * `scroll` — three modes, all rendered inside the fixed-height `.app-shell`
 * (`.app-shell__content` clips overflow, so document-level scroll never
 * reaches a tabbed screen — that only works for the screens below that live
 * outside the shell entirely):
 *  - `'fixed'` (Home, Feed, Group): sized to exactly the space the tab shell
 *    gives it, overflow hidden. Content here must actually fit — Feed's own
 *    post list opts back into scrolling via its own internal region, the
 *    same mechanism `'scroll'` below generalizes.
 *  - `'scroll'` (Settings — the one tabbed screen whose content is openly
 *    variable, e.g. a growing list of missed days): same fixed height, but
 *    scrolls internally instead of clipping.
 *  - `'page'` (default): the original document-scrolls-if-needed behavior,
 *    for screens outside the tab shell (Onboard's setup wizard, the Log
 *    action screen, the Day-7/8 Finale) where content genuinely varies in
 *    length and a scroll is normal, not a smell.
 */
export function Screen({
  children,
  testId,
  accent,
  scroll = 'page',
}: {
  children: ReactNode;
  testId?: string;
  accent?: string;
  scroll?: 'page' | 'fixed' | 'scroll';
}) {
  const scrollClass = scroll === 'fixed' ? 'screen--fixed' : scroll === 'scroll' ? 'screen--scroll' : '';
  return (
    <motion.main
      className={`screen ${scrollClass}`}
      data-testid={testId}
      variants={screenVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={accent ? ({ '--screen-accent': accent } as CSSProperties) : undefined}
    >
      <FloatingShapes />
      {children}
    </motion.main>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  testId,
  disabled,
  pulse,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'quiet' | 'plain';
  testId?: string;
  disabled?: boolean;
  /** A gentle idle glow pulse, inviting a tap — used sparingly, one CTA at a
   * time. Pulses a decorative glow BEHIND the button rather than scaling the
   * button itself: the actual clickable element never moves, so it's exactly
   * as tappable — real finger or Playwright's actionability check — whether
   * or not it's mid-pulse. */
  pulse?: boolean;
}) {
  return (
    <span style={{ position: 'relative', display: 'block' }}>
      {pulse && !disabled ? (
        <motion.span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: 'var(--r-full)',
            background: 'var(--screen-accent, var(--accent))',
            filter: 'blur(10px)',
            zIndex: -1,
          }}
          animate={{ opacity: [0.4, 0.05, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}
      <motion.button
        className={`btn btn--${variant}`}
        onClick={onClick}
        data-testid={testId}
        disabled={disabled}
        {...pressable}
      >
        {children}
      </motion.button>
    </span>
  );
}

/**
 * The hero number: the group total.
 *
 * This is the largest element in the application, everywhere it appears. That is
 * a product invariant, not a style choice — a decorative group goal next to a
 * prominent leaderboard gives you all of the social-comparison harm and none of
 * the cooperative benefit.
 */
export function GroupNumber({ total, target }: { total: number; target: number }) {
  return (
    <div className="hero" data-testid="group-number">
      <motion.div
        className="hero__value"
        key={total}
        initial={{ scale: 0.94, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
      >
        {total}
      </motion.div>
      <div className="hero__of">of {target}</div>
      <Meter value={total} max={target} />
    </div>
  );
}

/** A bar that only ever fills. It has no empty-and-falling state to render. */
export function Meter({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="meter" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <motion.div
        className="meter__fill"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ ...spring, mass: 1.2 }}
      />
    </div>
  );
}

/** Seven cells. A day with nothing in it is simply empty — no cross, no colour. */
export function DayStrip({
  today,
  covered,
  onPick,
}: {
  today: number;
  covered: Set<number>;
  onPick?: (day: number) => void;
}) {
  return (
    <motion.ol className="strip" variants={listVariants} initial="initial" animate="enter">
      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
        const state = covered.has(d) ? 'done' : d === today ? 'today' : d < today ? 'open' : 'future';
        return (
          <motion.li key={d} variants={itemVariants}>
            <button
              className={`cell cell--${state}`}
              data-testid={`day-${d}`}
              data-state={state}
              onClick={onPick ? () => onPick(d) : undefined}
              aria-label={`Day ${d}`}
            >
              {d}
            </button>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

/** A leaderboard rank number, medal-coloured for the top three. */
export function RankBadge({ rank }: { rank: number }) {
  const medal = rank <= 3 ? ` rank-badge--${rank}` : '';
  return <span className={`rank-badge${medal}`}>{rank}</span>;
}

/** The current-streak indicator: a gently pulsing flame plus the day count. */
export function StreakBadge({ streak, testId }: { streak: number; testId?: string }) {
  return (
    <span className="streak-badge" data-testid={testId}>
      <motion.span className="streak-badge__flame" {...flamePulse} />
      {streak}
    </span>
  );
}

/** The catch-up bonus badge. Design Revision 2026-08-27: now shown to the
 * whole group, not just its holder — see docs/PRODUCT-SPEC.md. */
export function CatchupBadge({ label, testId }: { label: string; testId?: string }) {
  return (
    <motion.span
      className="catchup-badge"
      data-testid={testId}
      variants={badgePop}
      initial="initial"
      animate="enter"
    >
      {label}
    </motion.span>
  );
}

export function Card({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <motion.section className="card" variants={itemVariants} data-testid={testId}>
      {children}
    </motion.section>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <button
      className="toggle"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__label">{label}</span>
      <span className={`toggle__track ${checked ? 'is-on' : ''}`}>
        <motion.span className="toggle__knob" layout transition={spring} />
      </span>
    </button>
  );
}
